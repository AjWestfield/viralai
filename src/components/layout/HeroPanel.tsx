export default function HeroPanel() {
  return (
    <div className="relative h-[300px] w-full rounded-3xl overflow-hidden mb-8 bg-[rgba(0,0,0,0.2)] backdrop-blur-lg">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(88,101,242,0.1)] to-[rgba(45,136,255,0.1)]" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6EE7B7] to-[rgba(88,101,242,1)]">
          Viral AI Analyzer
        </h1>
        <p className="mt-4 text-white/60 max-w-2xl">
          Analyze your video content with advanced AI to predict viral potential and optimize engagement
        </p>
      </div>
    </div>
  );
} 