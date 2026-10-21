import React from 'react';

export const BackgroundBooks: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden -z-10 select-none"
      aria-hidden="true"
    >
      {/* Soft natural ambient lighting complementing cream gradient and warm gold/olive tones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px] bg-[#D4A373]/15" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] rounded-full blur-[120px] bg-[#E8EFE9]/30" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] rounded-full blur-[100px] bg-[#FAF6EE]/60" />

      {/* Subtle organic texture dots */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #A3B18A 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};
