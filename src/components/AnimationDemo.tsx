import React from "react";
import { useAdvancedScrollAnimation } from "@/hooks/useAdvancedScrollAnimation";

export default function AnimationDemo() {
  return (
    <div className="py-12 space-y-16">
      <h2 className="text-3xl font-bold text-center mb-8">Demonstração das Animações de Scroll</h2>
      
      {/* Fade In */}
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-xl font-semibold mb-4">Fade In</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <FadeInCard key={i} index={i} />
          ))}
        </div>
      </div>

      {/* Slide Up */}
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-xl font-semibold mb-4">Slide Up</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SlideUpCard key={i} index={i} />
          ))}
        </div>
      </div>

      {/* Scale In */}
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-xl font-semibold mb-4">Scale In</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <ScaleInCard key={i} index={i} />
          ))}
        </div>
      </div>

      {/* Rotate In */}
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-xl font-semibold mb-4">Rotate In</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <RotateInCard key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FadeInCard({ index }: { index: number }) {
  const { elementRef, getAnimationClasses } = useAdvancedScrollAnimation({
    animationType: 'fadeIn',
    delay: index * 200
  });

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700`}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg mb-4"></div>
      <h4 className="text-lg font-semibold mb-2">Card {index}</h4>
      <p className="text-gray-600 dark:text-gray-300">
        Este card aparece com animação fade in e delay escalonado.
      </p>
    </div>
  );
}

function SlideUpCard({ index }: { index: number }) {
  const { elementRef, getAnimationClasses } = useAdvancedScrollAnimation({
    animationType: 'slideUp',
    delay: index * 150
  });

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700`}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg mb-4"></div>
      <h4 className="text-lg font-semibold mb-2">Card {index}</h4>
      <p className="text-gray-600 dark:text-gray-300">
        Este card desliza de baixo para cima com timing escalonado.
      </p>
    </div>
  );
}

function ScaleInCard({ index }: { index: number }) {
  const { elementRef, getAnimationClasses } = useAdvancedScrollAnimation({
    animationType: 'scaleIn',
    delay: index * 100
  });

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700`}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg mb-4"></div>
      <h4 className="text-lg font-semibold mb-2">Card {index}</h4>
      <p className="text-gray-600 dark:text-gray-300">
        Este card aparece com efeito de escala e delay progressivo.
      </p>
    </div>
  );
}

function RotateInCard({ index }: { index: number }) {
  const { elementRef, getAnimationClasses } = useAdvancedScrollAnimation({
    animationType: 'rotateIn',
    delay: index * 250
  });

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700`}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg mb-4"></div>
      <h4 className="text-lg font-semibold mb-2">Card {index}</h4>
      <p className="text-gray-600 dark:text-gray-300">
        Este card gira suavemente ao aparecer com delay escalonado.
      </p>
    </div>
  );
}
