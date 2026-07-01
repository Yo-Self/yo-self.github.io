import React from "react";
import { Complement, ComplementGroup } from "./data";
import ImageWithLoading from "./ImageWithLoading";
import ComplementPrefaceSelector from "./ComplementPrefaceSelector";
import { groupHasPreface } from "@/types/complementPreface";

interface ComplementGridProps {
  complementGroup: ComplementGroup;
  selectedComplements: Set<string>;
  onComplementToggle: (complementName: string) => void;
  prefaceAnswerId?: string;
  onPrefaceAnswerChange?: (answerId: string) => void;
  restaurantLogo?: string;
}

interface ComplementCardProps {
  complement: Complement;
  isSelected: boolean;
  isDisabled: boolean;
  prefaceBlocked: boolean;
  restaurantLogo?: string;
  onToggle: (complementName: string) => void;
}

const ComplementCard = React.memo(function ComplementCard({
  complement,
  isSelected,
  isDisabled,
  prefaceBlocked,
  restaurantLogo,
  onToggle,
}: ComplementCardProps) {
  const hasDescription = complement.description && complement.description.trim() !== '';

  return (
    <div
      className={`complement-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow cursor-pointer flex flex-col transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-primary dark:ring-cyan-400 bg-primary/5'
          : 'hover:shadow-md'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => {
        if (!isDisabled && !prefaceBlocked) {
          onToggle(complement.name);
        }
      }}
      style={{
        height: hasDescription ? '120px' : '90px',
        paddingBottom: 0,
      }}
    >
      <div
        className="relative w-full"
        style={{
          height: hasDescription ? '60%' : '100%',
        }}
      >
        <ImageWithLoading
          src={complement.image}
          alt={complement.name}
          clickable={false}
          loading="eager"
          className="object-cover rounded-t-lg"
          fallbackSrc={restaurantLogo || "/window.svg"}
        >
          <div
            className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10 transition-all duration-200 ${
              isSelected
                ? 'bg-primary dark:bg-cyan-400 text-white'
                : 'bg-white/80 text-gray-600'
            }`}
          >
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>

          {complement.price !== '0,00' && (
            <span className="absolute bottom-2 right-2 text-white text-sm font-bold px-0 py-0 z-10 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
              +R${complement.price}
            </span>
          )}

          <div className="absolute bottom-2 left-2 right-16">
            <span
              className="text-sm font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] leading-tight block"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                lineHeight: '1.1',
              }}
            >
              {complement.name}
            </span>
          </div>
        </ImageWithLoading>
      </div>

      {hasDescription && (
        <div
          className="w-full px-3 pb-3 pt-2 flex flex-col justify-center items-start text-left"
          style={{ height: '40%', minHeight: '36px' }}
        >
          <span
            className="text-xs text-gray-600 dark:text-gray-300 flex-shrink-0 block"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              lineHeight: '1.2',
              maxHeight: '3.6em',
            }}
          >
            {complement.description}
          </span>
        </div>
      )}
    </div>
  );
});

export default function ComplementGrid({
  complementGroup,
  selectedComplements,
  onComplementToggle,
  prefaceAnswerId,
  onPrefaceAnswerChange,
  restaurantLogo,
}: ComplementGridProps) {
  const prefaceActive = groupHasPreface(complementGroup);
  const prefaceBlocked = prefaceActive && !prefaceAnswerId;

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
          {complementGroup.title}
        </h3>
        {complementGroup.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {complementGroup.description}
          </p>
        )}
        {complementGroup.required && (
          <span className="inline-block bg-red-500 dark:bg-red-600 text-white text-xs px-2 py-1 rounded-full mb-2 font-medium shadow-sm">
            Obrigatório
          </span>
        )}
        {complementGroup.max_selections && (
          <span className="inline-block bg-blue-500 dark:bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2 mb-2 font-medium shadow-sm">
            Máximo {complementGroup.max_selections} opç{complementGroup.max_selections > 1 ? 'ões' : 'ão'}
          </span>
        )}
      </div>

      {prefaceActive && onPrefaceAnswerChange && (
        <ComplementPrefaceSelector
          question={complementGroup.preface_question || ""}
          options={complementGroup.preface_options}
          selectedAnswerId={prefaceAnswerId}
          onChange={onPrefaceAnswerChange}
        />
      )}

      {prefaceBlocked && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
          Responda a pergunta acima para escolher os complementos.
        </p>
      )}

      <div className={`grid grid-cols-2 gap-2 ${prefaceBlocked ? "opacity-50 pointer-events-none" : ""}`}>
        {complementGroup.complements.map((complement) => {
          const isSelected = selectedComplements.has(complement.name);
          const isDisabled = Boolean(
            complementGroup.max_selections &&
            selectedComplements.size >= complementGroup.max_selections &&
            !isSelected,
          );

          return (
            <ComplementCard
              key={complement.name}
              complement={complement}
              isSelected={isSelected}
              isDisabled={isDisabled}
              prefaceBlocked={prefaceBlocked}
              restaurantLogo={restaurantLogo}
              onToggle={onComplementToggle}
            />
          );
        })}
      </div>
    </div>
  );
}
