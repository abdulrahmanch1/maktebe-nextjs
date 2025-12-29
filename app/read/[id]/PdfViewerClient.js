'use client';

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { AuthContext } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { FaHighlighter, FaStickyNote, FaEraser } from 'react-icons/fa';
import DraggableNoteCard from '@/components/DraggableNoteCard';
import './PdfViewer.css';




const PdfViewerClient = ({ pdfUrl, bookTitle, bookId }) => {
  const canvasRef = useRef(null);
  const pdfInstanceRef = useRef(null);
  const pdfjsLibRef = useRef(null);
  const renderTaskRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const progressErrorRef = useRef(false);
  const lastPersistedProgressRef = useRef({ page: null, percentage: null });
  const lastScheduledProgressRef = useRef(null);
  const router = useRouter();

  const { isLoggedIn, user, setUser } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const scale = 2.0; // Fixed high-quality scale
  const [errorMessage, setErrorMessage] = useState('');
  const [pageAnimation, setPageAnimation] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileControlsVisible, setMobileControlsVisible] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideToolbarTimeoutRef = useRef(null);

  // --- Drawing / Planning Mode Logic (Hoisted) ---
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showDrawingToolbar, setShowDrawingToolbar] = useState(false);
  const [drawingTool, setDrawingTool] = useState('pen'); // 'pen' or 'eraser'
  const [penColor, setPenColor] = useState('rgba(255, 235, 59, 0.4)'); // Yellow
  const [penWidth, setPenWidth] = useState(25);
  const drawingCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]); // Array of {x, y} for current stroke
  const [drawings, setDrawings] = useState([]); // Array of stroke objects for current page
  const canvasScaleRef = useRef(scale); // Store current scale for coordinate conversion

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Page Notes Logic
  const [pageNotes, setPageNotes] = useState({}); // Map: pageNum -> Array of note objects
  const supabase = createClient();

  useEffect(() => {
    const fetchPageNotes = async () => {
      if (!isLoggedIn || !user || !bookId) {
        setPageNotes({});
        return;
      }
      try {
        const { data } = await supabase
          .from('page_notes')
          .select('*') // Select all fields including position and size
          .eq('book_id', bookId)
          .eq('user_id', user.id);

        const notesMap = {};
        if (data) {
          data.forEach(item => {
            const pNum = Number(item.page_number); // Ensure number
            if (!notesMap[pNum]) {
              notesMap[pNum] = [];
            }
            notesMap[pNum].push(item);
          });
        }
        setPageNotes(notesMap);
      } catch (err) {
        console.error('Error fetching page notes:', err);
      }
    };
    fetchPageNotes();
  }, [bookId, isLoggedIn, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 882px)');
    const handleChange = () => {
      setIsMobileViewport(media.matches);
      if (!media.matches) {
        setMobileControlsVisible(true);
      }
    };
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  // Auto-hide toolbar on desktop
  useEffect(() => {
    if (isMobileViewport) {
      setToolbarVisible(true);
      return;
    }

    const handleMouseMove = () => {
      setToolbarVisible(true);
      if (hideToolbarTimeoutRef.current) {
        clearTimeout(hideToolbarTimeoutRef.current);
      }
      hideToolbarTimeoutRef.current = setTimeout(() => {
        setToolbarVisible(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove(); // Initial call

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideToolbarTimeoutRef.current) {
        clearTimeout(hideToolbarTimeoutRef.current);
      }
    };
  }, [isMobileViewport]);

  const localStorageKey = useMemo(
    () => `reading-progress-${bookId}`,
    [bookId]
  );

  const readingListEntry = useMemo(() => {
    return user?.readingList?.find((item) => item.book === bookId);
  }, [user, bookId]);

  const startingPageRef = useRef(1);

  useEffect(() => {
    let page = 1;
    if (isLoggedIn && readingListEntry?.progress?.page) {
      page = readingListEntry.progress.page;
    } else if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(localStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.page) {
            page = parsed.page;
          }
        }
      } catch (error) {
        console.error('Failed to parse local progress:', error);
      }
    }
    startingPageRef.current = page;
  }, [isLoggedIn, localStorageKey, readingListEntry]);

  const computePercentage = useCallback(
    (pageNumber) => {
      if (!totalPages || pageNumber < 1) return 0;
      const ratio = (pageNumber / totalPages) * 100;
      return Math.min(100, Math.max(0, Number(ratio.toFixed(1))));
    },
    [totalPages]
  );

  const storeLocalProgress = useCallback(
    (pageNumber, percentage) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(
          localStorageKey,
          JSON.stringify({
            page: pageNumber,
            percentage,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error('Failed to store local progress:', error);
      }
    },
    [localStorageKey]
  );

  const persistServerProgress = useCallback(
    async (pageNumber, percentage) => {
      if (!isLoggedIn || !user) return;
      if (!user.readingList?.some((item) => item.book === bookId)) {
        return;
      }

      try {
        const response = await fetch(
          `/api/users/${user.id}/reading-list/${bookId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              progress: { page: pageNumber, percentage },
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to save progress');
        }

        setUser((prevUser) => {
          if (!prevUser || !Array.isArray(prevUser.readingList)) return prevUser;
          return {
            ...prevUser,
            readingList: prevUser.readingList.map((item) =>
              item.book === bookId
                ? {
                  ...item,
                  progress: {
                    page: pageNumber,
                    percentage,
                    updatedAt: new Date().toISOString(),
                  },
                }
                : item
            ),
          };
        });

        progressErrorRef.current = false;
        lastPersistedProgressRef.current = { page: pageNumber, percentage };
      } catch (error) {
        console.error('Failed to save reading progress:', error);
        if (!progressErrorRef.current) {
          toast.error('تعذر حفظ التقدم على الخادم، سيتم الحفظ محليًا فقط.');
          progressErrorRef.current = true;
        }
      }
    },
    [bookId, isLoggedIn, setUser, user]
  );

  const scheduleProgressSave = useCallback(
    (pageNumber) => {
      if (!pageNumber || !totalPages) return;
      const percentage = computePercentage(pageNumber);
      storeLocalProgress(pageNumber, percentage);

      if (!isLoggedIn || !user) {
        return;
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      if (
        lastPersistedProgressRef.current.page === pageNumber &&
        lastPersistedProgressRef.current.percentage === percentage
      ) {
        return;
      }

      if (
        lastScheduledProgressRef.current &&
        lastScheduledProgressRef.current.page === pageNumber &&
        lastScheduledProgressRef.current.percentage === percentage
      ) {
        return;
      }

      lastScheduledProgressRef.current = { page: pageNumber, percentage };

      saveTimeoutRef.current = setTimeout(async () => {
        await persistServerProgress(pageNumber, percentage);
        lastScheduledProgressRef.current = null;
      }, 5000); // Increased to 5s to prevent API spam
    },
    [
      computePercentage,
      isLoggedIn,
      persistServerProgress,
      storeLocalProgress,
      totalPages,
      user,
    ]
  );

  const renderPage = useCallback(
    async (pageNumber, scaleValue) => {
      if (!pdfInstanceRef.current || !canvasRef.current) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      setIsRendering(true);
      try {
        const page = await pdfInstanceRef.current.getPage(pageNumber);
        const viewport = page.getViewport({ scale: scaleValue });

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.height = viewport.height;
        offscreenCanvas.width = viewport.width;
        const offscreenContext = offscreenCanvas.getContext('2d');

        if (!offscreenContext) {
          throw new Error('تعذر تهيئة لوحة الرسم المؤقتة.');
        }

        const renderContext = { canvasContext: offscreenContext, viewport };
        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = offscreenCanvas.width;
        canvas.height = offscreenCanvas.height;
        context.drawImage(offscreenCanvas, 0, 0);
      } catch (error) {
        if (error?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', error);
          setErrorMessage('حدث خطأ أثناء عرض الصفحة.');
        }
      } finally {
        setIsRendering(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    const loadDocument = async () => {
      try {
        if (!pdfjsLibRef.current) {
          // Use local pdfjs-dist
          const pdfModule = await import('pdfjs-dist');

          if (typeof window !== 'undefined' && pdfModule?.GlobalWorkerOptions) {
            // Point to the worker we copied to public folder
            pdfModule.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          }
          pdfjsLibRef.current = pdfModule;
        }
        const { getDocument } = pdfjsLibRef.current;

        if (loadingTaskRef.current) {
          await loadingTaskRef.current.destroy();
          loadingTaskRef.current = null;
        }

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        if (pdfInstanceRef.current) {
          await pdfInstanceRef.current.destroy();
          pdfInstanceRef.current = null;
        }

        let docSource = pdfUrl;

        // Offline Fallback Logic
        if (!docSource) {
          console.log("No PDF URL provided, checking offline storage...");
          try {
            // Dynamic import to avoid SSR issues with IDB
            const { getOfflineBook } = await import('@/utils/db');
            const offlineBook = await getOfflineBook(bookId);
            if (offlineBook && offlineBook.pdfBlob) {
              console.log("Found offline book:", offlineBook.title);
              docSource = URL.createObjectURL(offlineBook.pdfBlob);
              // Also set title if missing (e.g. if page.js failed to fetch it)
              if (!bookTitle && offlineBook.title) {
                // This component doesn't have state for title, but we can update the document title at least
                document.title = `قراءة: ${offlineBook.title}`;
              }
            } else {
              throw new Error("الكتاب غير موجود في التخزين المحلي.");
            }
          } catch (offlineErr) {
            console.error("Failed to load from offline storage:", offlineErr);
            throw new Error("تعذر تحميل الكتاب.");
          }
        }

        const loadingTask = getDocument({ url: docSource });
        loadingTaskRef.current = loadingTask;
        const pdfDoc = await loadingTask.promise;
        if (!isMounted) {
          await pdfDoc.destroy();
          return;
        }
        pdfInstanceRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);

        const startingPage = Math.min(pdfDoc.numPages, Math.max(1, startingPageRef.current));
        setCurrentPage(startingPage);
      } catch (error) {
        console.error('Failed to load PDF document:', error);
        if (isMounted) {
          setErrorMessage(error.message || 'تعذر تحميل ملف الكتاب.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      if (loadingTaskRef.current) loadingTaskRef.current.destroy();
      if (pdfInstanceRef.current) pdfInstanceRef.current.destroy();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [pdfUrl, bookId, bookTitle]); // Added bookId, bookTitle dependencies

  useEffect(() => {
    if (!pdfInstanceRef.current || !totalPages) return;
    renderPage(currentPage, scale);
  }, [currentPage, renderPage, scale, totalPages]);

  useEffect(() => {
    if (totalPages > 0) {
      scheduleProgressSave(currentPage);
    }
  }, [currentPage, scheduleProgressSave, totalPages]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const goToPage = useCallback(
    (pageNumber, direction = null) => {
      if (!totalPages) return;
      const nextPage = Math.min(totalPages, Math.max(1, pageNumber));
      if (nextPage === currentPage) return;
      const inferredDirection =
        direction ||
        (nextPage > currentPage ? 'forward' : 'backward');
      setPageAnimation(inferredDirection);
      setCurrentPage(nextPage);
    },
    [currentPage, totalPages]
  );

  useEffect(() => {
    if (!pageAnimation) return;
    const timer = setTimeout(() => setPageAnimation(null), 180);
    return () => clearTimeout(timer);
  }, [pageAnimation]);

  const handleNextPage = useCallback(() => {
    goToPage(currentPage + 1, 'forward');
  }, [currentPage, goToPage]);

  const handlePrevPage = useCallback(() => {
    goToPage(currentPage - 1, 'backward');
  }, [currentPage, goToPage]);



  const handleSliderChange = (event) => {
    goToPage(Number(event.target.value));
  };

  const progressPercentage = computePercentage(currentPage);

  const handleTouchStart = useCallback((event) => {
    // Disable swipe gesture if drawing mode is active
    if (isDrawingMode) return;

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  }, [isDrawingMode]);



  const handleTouchEnd = useCallback((event) => {
    // Disable swipe gesture if drawing mode is active
    if (isDrawingMode) return;

    if (event.changedTouches.length === 0) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    const swipeThreshold = 50;
    if (isMobileViewport) {
      const verticalThreshold = 60;
      if (deltaY < -verticalThreshold) {
        setMobileControlsVisible(true);
      } else if (deltaY > verticalThreshold) {
        setMobileControlsVisible(false);
      }
    }

    if (elapsed < 600 && Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < 80) {
      if (deltaX > 0) handleNextPage();
      else handlePrevPage();
    }
  }, [handleNextPage, handlePrevPage, isDrawingMode, isMobileViewport]);

  // --- Drawing / Planning Mode Logic ---
  // State definitions moved to top to avoid ReferenceError with touch handlers

  // Load drawings for current page
  useEffect(() => {
    const fetchDrawings = async () => {
      if (!isLoggedIn || !user || !bookId) {
        setDrawings([]);
        return;
      }
      const { data, error } = await supabase
        .from('page_drawings')
        .select('*')
        .eq('book_id', bookId)
        .eq('page_number', currentPage)
        .eq('user_id', user.id);

      if (data) {
        // Flatten strokes from all rows (if multiple rows per page, though we might prefer one row per page or one row per stroke? 
        // Let's assume one row per page for simplicity, OR array of rows. 
        // If the table allows multiple rows per page (which is good for incremental saves), we merge them.
        // Actually, for simplicity, let's just create a new row for each session or stroke? 
        // Better: Fetch all rows for this page, each row could contain multiple strokes or one. 
        // Simplest for now: Each row is a "session" of strokes or a single stroke.
        // Let's treat 'strokes' column as an array of stroke objects.
        const allStrokes = data.flatMap(row => row.strokes || []);
        setDrawings(allStrokes);
      }
    };
    fetchDrawings();
  }, [bookId, currentPage, isLoggedIn, user, supabase]);

  // Sync drawing canvas size with PDF canvas
  useEffect(() => {
    const pdfCanvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (pdfCanvas && drawingCanvas) {
      drawingCanvas.width = pdfCanvas.width;
      drawingCanvas.height = pdfCanvas.height;
      redrawDrawings(drawings);
    }
  }, [currentPage, scale, isRendering, drawings]);

  const redrawDrawings = useCallback((strokesToDraw) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    strokesToDraw.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color || 'rgba(255, 235, 59, 0.4)';
      ctx.lineWidth = stroke.width || 25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pts = stroke.points;
      // Start
      ctx.moveTo(pts[0].x * width, pts[0].y * height);

      // Curve through midpoints
      for (let i = 1; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        const midX = (p1.x + p2.x) / 2 * width;
        const midY = (p1.y + p2.y) / 2 * height;
        const cpX = p1.x * width;
        const cpY = p1.y * height;

        ctx.quadraticCurveTo(cpX, cpY, midX, midY);
      }

      // Last point
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x * width, last.y * height);

      ctx.stroke();
    });
  }, []);

  const getPointerPos = (e) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    // Get the bounding rectangle of the canvas element
    const rect = canvas.getBoundingClientRect();

    // Calculate the actual displayed size of the image within the canvas
    // The canvas has object-fit: contain, so we need to know the aspect ratio of the internal bitmap
    const bitmapWidth = canvas.width;
    const bitmapHeight = canvas.height;

    // Calculate scaling ratios
    const scaleX = rect.width / bitmapWidth;
    const scaleY = rect.height / bitmapHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate the visual size and offsets
    const visualWidth = bitmapWidth * scale;
    const visualHeight = bitmapHeight * scale;
    const offsetX = (rect.width - visualWidth) / 2;
    const offsetY = (rect.height - visualHeight) / 2;

    // Get client coordinates
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    // Map to canvas relative coordinates
    const relativeX = clientX - rect.left - offsetX;
    const relativeY = clientY - rect.top - offsetY;

    // Normalize to 0-1 range
    let x = relativeX / visualWidth;
    let y = relativeY / visualHeight;

    // Clamp to [0, 1] to prevent drawing outside
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    return { x, y };
  };

  const startDrawing = useCallback((e) => {
    if (!isDrawingMode) return;
    if (e.cancelable) e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPointerPos(e);
    currentPathRef.current = [pos];
  }, [isDrawingMode]);

  const draw = useCallback((e) => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    if (e.cancelable && (isDrawingMode || e.type === 'touchmove')) {
      e.preventDefault(); // Strict prevention of scroll
      e.stopPropagation();
    }

    const pos = getPointerPos(e);

    if (drawingTool === 'eraser') {
      // Real-time Eraser Logic
      const eraserRadius = 0.05; // Adjust sensitivity

      setDrawings(prevDrawings => {
        const remaining = prevDrawings.filter(stroke => {
          // Check if ANY point in the stroke is close to the eraser position
          // This is a simplified hit-test. Ideally we check distance to line segments.
          return !stroke.points.some(p =>
            Math.abs(p.x - pos.x) < eraserRadius && Math.abs(p.y - pos.y) < eraserRadius
          );
        });

        // If changed, trigger update
        if (remaining.length !== prevDrawings.length) {
          // We'll handle DB sync in stopDrawing, or we can debounce it here.
          // For now, let's just update local state visually.
          return remaining;
        }
        return prevDrawings;
      });
      return; // Don't draw the eraser path itself
    }

    currentPathRef.current.push(pos);

    // Redraw everything to ensure consistent opacity
    // 1. Clear
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw existing strokes
    const width = canvas.width;
    const height = canvas.height;

    // Helper to draw a single stroke path
    const drawPath = (points, color, lineWidth) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2 * width;
        const midY = (p1.y + p2.y) / 2 * height;
        ctx.quadraticCurveTo(p1.x * width, p1.y * height, midX, midY);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x * width, last.y * height);
      ctx.stroke();
    };

    // Draw saved drawings
    drawings.forEach(stroke => {
      drawPath(stroke.points, stroke.color || 'rgba(255, 235, 59, 0.4)', stroke.width || 25);
    });

    // 3. Draw current active path
    if (currentPathRef.current.length > 1) {
      // For eraser, we still draw to show preview, but we'll remove strokes on stopDrawing
      drawPath(currentPathRef.current, drawingTool === 'eraser' ? 'rgba(255, 100, 100, 0.5)' : penColor, drawingTool === 'eraser' ? penWidth * 2 : penWidth);
    }
  }, [isDrawingMode, drawings, drawingTool, penColor, penWidth]);

  const stopDrawing = useCallback(async () => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (drawingTool === 'eraser') {
      // Sync after eraser session
      if (isLoggedIn && user) {
        try {
          // Delete all strokes for this page
          await supabase.from('page_drawings').delete()
            .eq('book_id', bookId)
            .eq('page_number', currentPage)
            .eq('user_id', user.id);

          // Re-insert remaining strokes if any
          if (drawings.length > 0) {
            await supabase.from('page_drawings').insert({
              book_id: bookId,
              user_id: user.id,
              page_number: currentPage,
              strokes: drawings
            });
          }
        } catch (err) {
          console.error("Failed to update after erase:", err);
        }
      }
    } else if (currentPathRef.current.length > 1) {
      // Normal pen: Add new stroke
      const newStroke = {
        points: currentPathRef.current,
        color: penColor,
        width: penWidth,
        tool: 'pen'
      };

      const newDrawings = [...drawings, newStroke];
      setDrawings(newDrawings);

      // Only save to database if user is logged in
      if (isLoggedIn && user) {
        try {
          await supabase.from('page_drawings').insert({
            book_id: bookId,
            user_id: user.id,
            page_number: currentPage,
            strokes: [newStroke]
          });
        } catch (err) {
          console.error("Failed to save stroke:", err);
        }
      }
    }
    currentPathRef.current = [];
  }, [isDrawingMode, drawings, bookId, user, currentPage, supabase, isLoggedIn, drawingTool, penColor, penWidth]);

  // Attach non-passive touch listeners to support preventing scroll while drawing
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    // Only attach listeners if we are in drawing mode
    if (!isDrawingMode) return;

    const handleTouchStartPassthrough = (e) => startDrawing(e);
    const handleTouchMovePassthrough = (e) => draw(e);

    // We must use { passive: false } to allow e.preventDefault() in startDrawing/draw
    canvas.addEventListener('touchstart', handleTouchStartPassthrough, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMovePassthrough, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStartPassthrough);
      canvas.removeEventListener('touchmove', handleTouchMovePassthrough);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawingMode, draw, startDrawing, stopDrawing]);

  const handleToggleDrawing = () => {
    const newMode = !isDrawingMode;
    setIsDrawingMode(newMode);
    setShowDrawingToolbar(newMode); // Always show toolbar when painting, hide when stopped

    if (newMode && !isLoggedIn) {
      // Show warning only once for guest users when enabling
      const hasSeenWarning = sessionStorage.getItem('drawing_guest_warning');
      if (!hasSeenWarning) {
        toast.warning("⚠️ لن يتم حفظ الرسومات. سجّل الدخول للحفظ.", { autoClose: 5000 });
        sessionStorage.setItem('drawing_guest_warning', 'true');
      }
    } else if (!newMode) {
      // Optional: toast info when closed
      // toast.info("تم إيقاف القلم");
    }
  };

  // --- End Drawing Logic ---

  const handleUpdateNote = async (noteId, updates) => {
    // Optimistic update
    setPageNotes(prev => {
      const notes = prev[currentPage] ? [...prev[currentPage]] : [];
      const noteIndex = notes.findIndex(n => n.id === noteId);
      if (noteIndex > -1) {
        notes[noteIndex] = { ...notes[noteIndex], ...updates };
        return { ...prev, [currentPage]: notes };
      }
      return prev;
    });

    try {
      await supabase
        .from('page_notes')
        .update(updates)
        .eq('id', noteId);
    } catch (err) {
      console.error("Failed to update note:", err);
      toast.error("فشل حفظ التعديلات");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("حذف الملاحظة؟")) return;

    // Optimistic delete
    setPageNotes(prev => {
      const notes = prev[currentPage] ? prev[currentPage].filter(n => n.id !== noteId) : [];
      const newMap = { ...prev };
      if (notes.length === 0) delete newMap[currentPage];
      else newMap[currentPage] = notes;
      return newMap;
    });

    try {
      await supabase.from('page_notes').delete().eq('id', noteId);
    } catch (err) {
      console.error("Failed to delete note:", err);
      toast.error("فشل حذف الملاحظة");
    }
  };

  const handleCreateNote = async () => {
    console.log("handleCreateNote called");
    if (!user) {
      console.error("User not logged in");
      toast.error("يجب تسجيل الدخول");
      return;
    }
    if (!bookId) {
      console.error("Missing bookId");
      toast.error("حدث خطأ: رقم الكتاب مفقود");
      return;
    }

    // Direct insert clean note
    const newNote = {
      book_id: bookId,
      user_id: user.id,
      page_number: currentPage,
      note: ' ',
      req_x: 50,
      req_y: 50,
      width: 200,
      height: 150,
      color: '#fbf8cc'
    };

    try {
      const { data, error } = await supabase
        .from('page_notes')
        .insert(newNote)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (data) {
        setPageNotes(prev => {
          const notes = prev[currentPage] ? [...prev[currentPage]] : [];
          notes.push(data);
          return { ...prev, [currentPage]: notes };
        });
      }
    } catch (e) {
      // If e is custom thrown error, it has message. If generic, might be empty obj if not handled.
      console.error("Catch block caught error:", e);
      if (e.message) console.error("Error message:", e.message);
      toast.error("فشل إنشاء الملاحظة: " + (e.message || "خطأ غير معروف"));
    }
  };

  const handleCanvasLeave = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  return (
    <div className="pdf-viewer-root">
      <div
        className={[
          'pdf-viewer-canvas-wrapper',
          isMobileViewport && mobileControlsVisible ? 'toolbar-offset' : '',
        ]
          .filter(Boolean)
          .join(' ')}

        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          className={`pdf-viewer-canvas ${pageAnimation ? `animate-${pageAnimation}` : ''
            }`}
        />
        {/* Drawing Canvas Overlay */}
        <canvas
          ref={drawingCanvasRef}
          className="drawing-canvas-layer"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: isDrawingMode ? 'auto' : 'none',
            // Critical: Block default touch actions (scrolling) ONLY when this element is interactive
            touchAction: 'none',
            zIndex: 10,
            cursor: isDrawingMode ? "url('/highlighter-cursor.svg') 4 28, crosshair" : 'default',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={handleCanvasLeave}
        />

        {/* Drawing Toolbar */}
        {showDrawingToolbar && isDrawingMode && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            background: 'rgba(20, 20, 20, 0.95)', // Slightly more opaque
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '30px 0', // More vertical padding, zero horizontal (controlled by width)
            width: '56px', // Fixed slim width
            borderRadius: '100px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px', // Increased gap for more height
            alignItems: 'center',
            zIndex: 200,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '85vh',
            overflow: 'hidden' // Hide ALL scrollbars
          }}>
            {/* Pen Colors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              {[
                { color: 'rgba(255, 235, 59, 0.4)', label: 'أصفر' },
                { color: 'rgba(76, 175, 80, 0.4)', label: 'أخضر' },
                { color: 'rgba(33, 150, 243, 0.4)', label: 'أزرق' },
                { color: 'rgba(255, 152, 0, 0.4)', label: 'برتقالي' },
                { color: 'rgba(233, 30, 99, 0.4)', label: 'وردي' },
              ].map((item) => (
                <button
                  key={item.color}
                  onClick={() => { setPenColor(item.color); setDrawingTool('pen'); }}
                  title={item.label}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: item.color,
                    border: penColor === item.color && drawingTool === 'pen' ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    padding: 0,
                    appearance: 'none',
                    outline: 'none',
                    transform: penColor === item.color && drawingTool === 'pen' ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: penColor === item.color ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
                    flexShrink: 0
                  }}
                />
              ))}
            </div>

            {/* Divider */}
            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />

            {/* Eraser */}
            <button
              onClick={() => setDrawingTool('eraser')}
              title="ممحاة"
              style={{
                padding: '8px',
                background: drawingTool === 'eraser' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <FaEraser />
            </button>

            {/* Divider */}
            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />

            {/* Width Control - Rotated for vertical feeling or just small input */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>📏</span>
              {/* Vertical Slider Wrapper */}
              <div style={{ height: '80px', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={penWidth}
                  onChange={(e) => setPenWidth(Number(e.target.value))}
                  title={`حجم الخط: ${penWidth}px`}
                  style={{
                    width: '80px',
                    height: '20px',
                    position: 'absolute', // Absolute to not affect parent width
                    cursor: 'pointer',
                    accentColor: 'white',
                    transform: 'rotate(-90deg)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Render Page Notes */}
        {pageNotes[currentPage] && pageNotes[currentPage].map(note => {
          return (
            <DraggableNoteCard
              key={note.id}
              id={note.id}
              content={note.note}
              initialX={note.req_x || 50}
              initialY={note.req_y || 50}
              initialWidth={note.width || 200}
              initialHeight={note.height || 150}
              initialColor={note.color || '#fbf8cc'}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
            />
          );
        })}
        {errorMessage && (
          <div className="pdf-viewer-overlay error">
            <div className="pdf-viewer-status error">
              <span>{errorMessage}</span>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                فتح أو تحميل الكتاب
              </a>
            </div>
          </div>
        )}
        {!errorMessage && isLoading && (
          <div className="pdf-viewer-overlay">
            <div className="pdf-viewer-status">
              جاري تحميل الكتاب...
            </div>
          </div>
        )}
      </div>

      <div
        className={[
          'pdf-smart-dock',
          !toolbarVisible ? 'hidden' : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="dock-title-bubble">{bookTitle}</div>

        {/* Navigation Section */}
        <div className="dock-section">
          <button
            className="dock-button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isRendering}
            title="الصفحة السابقة"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <span className="dock-page-info">
            {currentPage} / {totalPages || '..'}
          </span>

          <button
            className="dock-button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isRendering}
            title="الصفحة التالية"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="dock-divider" />

        {/* Progress Section (Hidden on minimal mobile views via CSS if needed, but we try to keep it) */}
        <div className="dock-slider-container">
          <input
            type="range"
            min="1"
            max={totalPages || 1}
            value={currentPage}
            onChange={handleSliderChange}
            className="dock-slider"
            title="شريط التقدم"
          />
        </div>

        <div className="dock-divider" />

        {/* Tools Section */}
        <div className="dock-section">
          <button
            className={`dock-button ${isDrawingMode ? 'active' : ''}`}
            onClick={handleToggleDrawing}
            title="تظليل / رسم"
          >
            <FaHighlighter />
          </button>

          <button
            className="dock-button"
            onClick={handleCreateNote}
            title="إضافة ملاحظة"
          >
            <FaStickyNote />
          </button>

          <button
            className="dock-button"
            onClick={() => router.back()}
            title="خروج"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
              <path d="M15 3h6v6"></path>
              <path d="M10 14L21 3"></path>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div >
  );
};

export default PdfViewerClient;
