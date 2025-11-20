'use client';
import dynamic from 'next/dynamic';

const DynamicToastContainer = dynamic(
    () => import('react-toastify').then(mod => mod.ToastContainer),
    {
        ssr: false,
        loading: () => null
    }
);

export default DynamicToastContainer;
