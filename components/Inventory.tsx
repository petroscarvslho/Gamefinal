import React, { useState, useCallback, useEffect } from 'react';
import { InventoryItem, ItemCategory, GAME_ITEMS } from '../types';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  onDropItem: (item: InventoryItem) => void;
}

const RARITY_COLORS = {
  comum: 'border-slate-400 bg-slate-800/80',
  incomum: 'border-green-400 bg-green-900/30',
  raro: 'border-blue-400 bg-blue-900/30',
  epico: 'border-purple-400 bg-purple-900/30',
};

const RARITY_GLOW = {
  comum: '',
  incomum: 'shadow-[0_0_8px_rgba(74,222,128,0.3)]',
  raro: 'shadow-[0_0_12px_rgba(96,165,250,0.4)]',
  epico: 'shadow-[0_0_16px_rgba(192,132,252,0.5)]',
};

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  [ItemCategory.MEDICAMENTO]: '💊',
  [ItemCategory.EQUIPAMENTO]: '🔧',
  [ItemCategory.DOCUMENTO]: '📄',
  [ItemCategory.SUPRIMENTO]: '📦',
  [ItemCategory.FERRAMENTA]: '🛠️',
  [ItemCategory.CONSUMIVEL]: '🍎',
};

const Inventory: React.FC<InventoryProps> = ({
  isOpen,
  onClose,
  items,
  onUseItem,
  onDropItem,
}) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyI') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(item => item.category === activeCategory);

  const categories: (ItemCategory | 'all')[] = ['all', ...Object.values(ItemCategory)];

  const maxSlots = 24;
  const slots = Array.from({ length: maxSlots }, (_, i) => filteredItems[i] || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Main Container */}
      <div
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-amber-400/80 rounded-lg shadow-[0_0_40px_rgba(251,191,36,0.2)] p-1"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {/* Decorative corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-amber-300 rounded-tl" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-amber-300 rounded-tr" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-amber-300 rounded-bl" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-amber-300 rounded-br" />

        {/* Inner border */}
        <div className="bg-slate-800/50 border-2 border-slate-600/50 rounded p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-600/50">
            <h2 className="text-amber-300 text-sm tracking-wider flex items-center gap-2">
              <span className="text-lg">🎒</span>
              INVENTARIO
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-400 text-xs px-2 py-1 border border-slate-600 rounded hover:border-red-400 transition-colors"
            >
              [X]
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 text-[8px] rounded border transition-all ${
                  activeCategory === cat
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                    : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {cat === 'all' ? '📦 TODOS' : `${CATEGORY_ICONS[cat]} ${cat.toUpperCase().slice(0, 4)}`}
              </button>
            ))}
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            {slots.map((item, index) => (
              <div
                key={index}
                className={`
                  relative w-14 h-14 rounded border-2 flex items-center justify-center cursor-pointer
                  transition-all duration-150
                  ${item
                    ? `${RARITY_COLORS[item.rarity]} ${RARITY_GLOW[item.rarity]} hover:scale-105`
                    : 'border-slate-700 bg-slate-900/50'
                  }
                  ${selectedItem?.id === item?.id ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : ''}
                `}
                onClick={() => item && setSelectedItem(item)}
                onMouseEnter={() => setHoveredSlot(index)}
                onMouseLeave={() => setHoveredSlot(null)}
              >
                {item ? (
                  <>
                    <span className="text-2xl">{item.icon}</span>
                    {item.quantity > 1 && (
                      <span className="absolute bottom-0 right-1 text-[8px] text-white font-bold bg-slate-900/80 px-1 rounded">
                        x{item.quantity}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-700 text-xl">·</span>
                )}

                {/* Tooltip */}
                {hoveredSlot === index && item && (
                  <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-slate-900 border border-slate-600 rounded p-2 shadow-lg pointer-events-none">
                    <div className="text-[8px] text-amber-300 mb-1">{item.name}</div>
                    <div className="text-[7px] text-slate-400">{item.description}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[7px] text-slate-500">{item.category}</span>
                      <span className={`text-[7px] ${
                        item.rarity === 'comum' ? 'text-slate-400' :
                        item.rarity === 'incomum' ? 'text-green-400' :
                        item.rarity === 'raro' ? 'text-blue-400' : 'text-purple-400'
                      }`}>
                        {item.rarity.toUpperCase()}
                      </span>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Item Details Panel */}
          {selectedItem && (
            <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
              <div className="flex items-start gap-3">
                {/* Item Icon */}
                <div className={`w-16 h-16 rounded border-2 flex items-center justify-center ${RARITY_COLORS[selectedItem.rarity]} ${RARITY_GLOW[selectedItem.rarity]}`}>
                  <span className="text-4xl">{selectedItem.icon}</span>
                </div>

                {/* Item Info */}
                <div className="flex-1">
                  <h3 className="text-amber-300 text-[10px] mb-1">{selectedItem.name}</h3>
                  <p className="text-slate-400 text-[7px] mb-2 leading-relaxed">{selectedItem.description}</p>
                  <div className="flex items-center gap-2 text-[7px]">
                    <span className="text-slate-500">{CATEGORY_ICONS[selectedItem.category]} {selectedItem.category}</span>
                    <span className="text-slate-600">|</span>
                    <span className={`${
                      selectedItem.rarity === 'comum' ? 'text-slate-400' :
                      selectedItem.rarity === 'incomum' ? 'text-green-400' :
                      selectedItem.rarity === 'raro' ? 'text-blue-400' : 'text-purple-400'
                    }`}>
                      {selectedItem.rarity.charAt(0).toUpperCase() + selectedItem.rarity.slice(1)}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">Qtd: {selectedItem.quantity}/{selectedItem.maxStack}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  {selectedItem.usable && (
                    <button
                      onClick={() => onUseItem(selectedItem)}
                      className="px-3 py-1 text-[8px] bg-emerald-600/30 border border-emerald-400 text-emerald-300 rounded hover:bg-emerald-500/30 transition-colors"
                    >
                      USAR
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDropItem(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="px-3 py-1 text-[8px] bg-red-600/20 border border-red-400/50 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    DESCARTAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700">
            <span className="text-[8px] text-slate-500">
              {items.length}/{maxSlots} slots usados
            </span>
            <span className="text-[8px] text-slate-600">
              [I] Fechar | Click para selecionar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
