import Image from 'next/image';

interface BundleImageProps {
  quantity: number; // 2, 3, or 4
  size?: number; // base bottle image size in px (default 150)
  className?: string;
}

export function BundleImage({ quantity, size = 150, className = '' }: BundleImageProps) {
  // Generate array of positions for layered bottles
  const bottles = Array.from({ length: quantity }, (_, i) => i);

  // Scale offset proportionally to size
  const offset = Math.round((size / 150) * 18);

  // Calculate the container size to fit all bottles
  const containerWidth = size + (quantity - 1) * offset;
  const containerHeight = size + (quantity - 1) * offset;

  return (
    <div className={`relative ${className}`} style={{ width: containerWidth, height: containerHeight, margin: '0 auto' }}>
      <div className="relative w-full h-full">
        {bottles.map((index) => (
          <div
            key={index}
            className="absolute"
            style={{
              transform: `translate(${index * offset}px, ${index * -offset}px) rotate(${index * 5}deg)`,
              zIndex: index,
              filter: index === bottles.length - 1 ? 'none' : 'brightness(0.9)',
              left: 0,
              top: (quantity - 1 - index) * offset,
            }}
          >
            <Image
              src="/images/products/lavender-oil.png"
              alt="Lavender Essential Oil"
              width={size}
              height={size}
              className="object-contain drop-shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
