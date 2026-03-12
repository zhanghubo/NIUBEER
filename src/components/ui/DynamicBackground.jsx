import React from 'react';

/**
 * 全屏动态背景：光球漂移 + 若隐若现的电路图，随光球移动被照亮，增强科技感
 * @returns {JSX.Element}
 */
export function DynamicBackground() {
  return (
    <div className="dynamic-bg" aria-hidden>
      {/* 绿色光球 */}
      <div className="dynamic-bg__orb dynamic-bg__orb--1" />
      <div className="dynamic-bg__orb dynamic-bg__orb--2" />
      <div className="dynamic-bg__orb dynamic-bg__orb--3" />
      <div className="dynamic-bg__orb dynamic-bg__orb--4" />
      <div className="dynamic-bg__orb dynamic-bg__orb--5" />
      {/* 电路图层：若隐若现 */}
      <div className="dynamic-bg__circuit" />
      {/* 与光球同步的“光照”层，照亮电路 */}
      <div className="dynamic-bg__circuit-lights">
        <div className="dynamic-bg__circuit-light dynamic-bg__circuit-light--1" />
        <div className="dynamic-bg__circuit-light dynamic-bg__circuit-light--2" />
        <div className="dynamic-bg__circuit-light dynamic-bg__circuit-light--3" />
        <div className="dynamic-bg__circuit-light dynamic-bg__circuit-light--4" />
        <div className="dynamic-bg__circuit-light dynamic-bg__circuit-light--5" />
      </div>
    </div>
  );
}
