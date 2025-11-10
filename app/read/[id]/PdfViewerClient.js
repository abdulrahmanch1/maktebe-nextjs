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
  const [scale, setScale] = useState(1.2);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageAnimation, setPageAnimation] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileControlsVisible, setMobileControlsVisible] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isPinchingRef = useRef(false);
  const pinchDistanceStartRef = useRef(0);
  const pinchScaleStartRef = useRef(scale);

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
      }, 1200);
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
          const pdfModule = await import(
            /* webpackIgnore: true */
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/legacy/build/pdf.min.mjs'
          );
          const workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/legacy/build/pdf.worker.min.mjs';
          if (pdfModule?.GlobalWorkerOptions) {
            pdfModule.GlobalWorkerOptions.workerSrc = workerSrc;
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

        const loadingTask = getDocument({ url: pdfUrl });
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
          setErrorMessage('تعذر تحميل ملف الكتاب. حاول مجددًا لاحقًا.');
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
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
        loadingTaskRef.current = null;
      }
      if (pdfInstanceRef.current) {
        pdfInstanceRef.current.destroy();
        pdfInstanceRef.current = null;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [pdfUrl]);

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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
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
    const timer = setTimeout(() => setPageAnimation(null), 280);
    return () => clearTimeout(timer);
  }, [pageAnimation]);

  const handleNextPage = useCallback(() => {
    goToPage(currentPage + 1, 'forward');
  }, [currentPage, goToPage]);

  const handlePrevPage = useCallback(() => {
    goToPage(currentPage - 1, 'backward');
  }, [currentPage, goToPage]);

  const handleScaleChange = (direction) => {
    setScale((prev) => {
      const delta = direction === 'in' ? 0.1 : -0.1;
      const nextScale = Math.min(2.5, Math.max(0.6, parseFloat((prev + delta).toFixed(2))));
      return nextScale;
    });
  };

  const handleSliderChange = (event) => {
    const targetPage = Number(event.target.value);
    const direction = targetPage > currentPage ? 'forward' : 'backward';
    goToPage(targetPage, direction);
  };

  const progressPercentage = computePercentage(currentPage);

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      isPinchingRef.current = false;
    } else if (event.touches.length === 2) {
      event.preventDefault();
      const [touch1, touch2] = event.touches;
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      pinchDistanceStartRef.current = Math.hypot(dx, dy);
      pinchScaleStartRef.current = scale;
      isPinchingRef.current = true;
    }
  }, [scale]);

  const handleTouchMove = useCallback((event) => {
    if (event.touches.length === 2 && isPinchingRef.current) {
      event.preventDefault();
      const [touch1, touch2] = event.touches;
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.hypot(dx, dy);
      if (pinchDistanceStartRef.current === 0) {
        pinchDistanceStartRef.current = currentDistance;
        return;
      }
      const scaleFactor = currentDistance / pinchDistanceStartRef.current;
      const newScale = Math.min(2.5, Math.max(0.6, parseFloat((pinchScaleStartRef.current * scaleFactor).toFixed(2))));
      setScale(newScale);
    }
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (isPinchingRef.current) {
      if (event.touches.length < 2) {
        isPinchingRef.current = false;
        pinchDistanceStartRef.current = 0;
      }
      return;
    }

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
      if (deltaX > 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
  }, [handleNextPage, handlePrevPage, isMobileViewport]);

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
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
          <canvas
            ref={canvasRef}
            className={`pdf-viewer-canvas ${
              pageAnimation ? `animate-${pageAnimation}` : ''
            }`}
          />
        {errorMessage && (
          <div className="pdf-viewer-overlay error">
            <div className="pdf-viewer-status error">
              <span>{errorMessage}</span>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                فتح أو تحميل الكتاب مباشرةً
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
          'pdf-viewer-toolbar',
          'bottom',
          isMobileViewport && mobileControlsVisible ? 'mobile-visible' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="pdf-viewer-title" title={bookTitle}>{bookTitle}</div>
        <div className="pdf-viewer-controls">
          <button
            className="pdf-viewer-button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isRendering}
          >
            الصفحة السابقة
          </button>
          <span className="pdf-viewer-page-indicator">
            {currentPage} / {totalPages || '...'}
          </span>
          <button
            className="pdf-viewer-button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isRendering}
          >
            الصفحة التالية
          </button>
          <button
            className="pdf-viewer-button"
            onClick={() => handleScaleChange('out')}
            disabled={scale <= 0.6}
            title="تصغير"
          >
            -
          </button>
          <span className="pdf-viewer-scale">{Math.round(scale * 100)}%</span>
          <button
            className="pdf-viewer-button"
            onClick={() => handleScaleChange('in')}
            disabled={scale >= 2.5}
            title="تكبير"
          >
            +
          </button>
          <div className="pdf-viewer-progress-wrapper">
            <input
              type="range"
              min="1"
              max={totalPages || 1}
              value={currentPage}
              onChange={handleSliderChange}
              className="pdf-viewer-slider"
            />
            <span className="pdf-viewer-progress-text">
              تقدم القراءة: {progressPercentage}%
            </span>
          </div>
          <button className="pdf-viewer-button secondary" onClick={() => router.back()}>
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfViewerClient;
