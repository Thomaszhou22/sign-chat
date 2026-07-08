interface SignImageProps {
  label: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SignImage({ label, imageUrl, size = 'md', className = '' }: SignImageProps) {
  const sizes = {
    sm: { width: 80, height: 80, fontSize: 32 },
    md: { width: 160, height: 160, fontSize: 48 },
    lg: { width: 240, height: 240, fontSize: 64 },
  };

  const { width, height, fontSize } = sizes[size];

  if (imageUrl) {
    return (
      <div className={`inline-block ${className}`}>
        <img
          src={imageUrl}
          alt={`ASL sign for ${label}`}
          width={width}
          height={height}
          className="object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback for signs without images
  return (
    <div
      className={`inline-flex items-center justify-center bg-gray-800 rounded-xl ${className}`}
      style={{ width, height }}
    >
      <span className="font-bold text-cyan-400" style={{ fontSize }}>
        {label}
      </span>
    </div>
  );
}
