'use client';
import React from 'react';
import './Overlay.css';

const Overlay = ({ isOpen, onClick }) => {
  return isOpen ? <div className="overlay" onClick={onClick}></div> : null;
};

export default Overlay;
