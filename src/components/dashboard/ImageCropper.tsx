import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";

const CROP_SIZE = 300;

interface ImageCropperProps {
  imageSrc: string;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper = ({ imageSrc, onApply, onCancel }: ImageCropperProps) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const touchRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const clampPos = useCallback((p: { x: number; y: number }, s: number) => {
    const img = imgRef.current;
    if (!img) return p;
    const hw = (img.naturalWidth * s) / 2;
    const hh = (img.naturalHeight * s) / 2;
    const half = CROP_SIZE / 2;
    return {
      x: Math.min(Math.max(hw - half, 0), Math.max(-(hw - half), Math.min(hw - half, p.x))),
      y: Math.min(Math.max(hh - half, 0), Math.max(-(hh - half), Math.min(hh - half, p.y))),
    };
  }, []);

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const fitScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    setScale(fitScale);
    setPos({ x: 0, y: 0 });
    setImgLoaded(true);
  };

  const applyZoom = (delta: number) => {
    setScale((s) => {
      const ns = Math.min(5, Math.max(0.3, s + delta));
      setPos((p) => clampPos(p, ns));
      return ns;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clampPos({ x: dragRef.current.posX + dx, y: dragRef.current.posY + dy }, scale));
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    applyZoom(e.deltaY < 0 ? 0.1 : -0.1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    touchRef.current = { startX: t.clientX, startY: t.clientY, posX: pos.x, posY: pos.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    setPos(clampPos({ x: touchRef.current.posX + dx, y: touchRef.current.posY + dy }, scale));
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const srcX = (0 - (CROP_SIZE / 2 + pos.x)) / scale + img.naturalWidth / 2;
    const srcY = (0 - (CROP_SIZE / 2 + pos.y)) / scale + img.naturalHeight / 2;
    const srcW = CROP_SIZE / scale;
    const srcH = CROP_SIZE / scale;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);
    canvas.toBlob((blob) => { if (blob) onApply(blob); }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 flex flex-col gap-5 items-center w-full max-w-sm shadow-2xl">
        <div className="text-center">
          <h3 className="font-semibold text-foreground text-lg">Adjust Photo</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Drag to reposition · Scroll or use buttons to zoom
          </p>
        </div>

        <div
          className={`relative overflow-hidden rounded-full border-2 border-primary select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ width: CROP_SIZE, height: CROP_SIZE, flexShrink: 0 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {!imgLoaded && (
            <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground text-sm">
              Loading...
            </div>
          )}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            draggable={false}
            onLoad={handleImgLoad}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
              transformOrigin: "center center",
              maxWidth: "none",
              userSelect: "none",
              pointerEvents: "none",
              visibility: imgLoaded ? "visible" : "hidden",
            }}
          />
        </div>

        <div className="flex items-center gap-4 w-full justify-center">
          <Button variant="outline" size="icon" onClick={() => applyZoom(-0.15)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <input
            type="range"
            min={30}
            max={500}
            value={Math.round(scale * 100)}
            onChange={(e) => {
              const ns = parseInt(e.target.value) / 100;
              setScale(ns);
              setPos((p) => clampPos(p, ns));
            }}
            className="w-32 accent-primary"
          />
          <Button variant="outline" size="icon" onClick={() => applyZoom(0.15)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            <Check className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};
