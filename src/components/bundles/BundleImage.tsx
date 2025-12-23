import Image from 'next/image';

interface BundleImageProps {
  quantity: number; // 2, 3, or 4
  className?: string;
}

export function BundleImage({ quantity, className = '' }: BundleImageProps) {
  // Generate array of positions for layered bottles
  const bottles = Array.from({ length: quantity }, (_, i) => i);

  // Calculate the container size to fit all bottles
  const containerWidth = 150 + (quantity - 1) * 18;
  const containerHeight = 150 + (quantity - 1) * 18;

  return (
    <div className={`relative ${className}`} style={{ width: containerWidth, height: containerHeight, margin: '0 auto' }}>
      <div className="relative w-full h-full">
        {bottles.map((index) => (
          <div
            key={index}
            className="absolute"
            style={{
              transform: `translate(${index * 18}px, ${index * -18}px) rotate(${index * 5}deg)`,
              zIndex: index,
              filter: index === bottles.length - 1 ? 'none' : 'brightness(0.9)',
              left: 0,
              top: (quantity - 1 - index) * 18,
            }}
          >
            <Image
              src="/images/products/lavender-oil.png"
              alt="Lavender Essential Oil"
              width={150}
              height={150}
              className="object-contain drop-shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
