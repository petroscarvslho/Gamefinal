/**
 * MapEditor - Editor visual de mapas estilo RPG Maker
 * Otimizado para consistência visual com GameEngine
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TileType } from '../types';
import { TILE_SIZE } from '../constants';
import { mapStorage, MapData } from '../services/mapStorage';

interface MapEditorProps {
  onClose: () => void;
  onTestMap?: (map: MapData) => void;
}

// Cores consistentes com GameEngine
const COLORS = {
  floor: { base: '#e8e4d9', alt: '#dedad0', line: '#c8c4b8' },
  floorOR: { base: '#d0eef8', alt: '#c0e8f4', line: '#a8d8ea' },
  wall: { top: '#f5f5f0', base: '#d8d4c8', dark: '#a8a498', bottom: '#78746a' },
  wood: { light: '#d4a574', base: '#b8885c', dark: '#8c6644' },
  metal: { light: '#e0e4e8', base: '#b0b8c0', dark: '#808890' },
  bed: { frame: '#e8e8e8', sheet: '#6eb5f0', pillow: '#fff' },
  plant: { pot: '#b45309', leaf: '#22a055', leafLight: '#4ade80' },
};

// Categorias de tiles
interface TileOption {
  type: TileType;
  name: string;
  solid?: boolean;
}

const TILE_CATEGORIES: { category: string; icon: string; tiles: TileOption[] }[] = [
  {
    category: 'Estrutura',
    icon: '🏗️',
    tiles: [
      { type: TileType.FLOOR, name: 'Piso' },
      { type: TileType.FLOOR_OR, name: 'Piso CC' },
      { type: TileType.WALL, name: 'Parede', solid: true },
      { type: TileType.DOOR, name: 'Porta' },
    ]
  },
  {
    category: 'Hospital',
    icon: '🏥',
    tiles: [
      { type: TileType.BED, name: 'Cama', solid: true },
      { type: TileType.STRETCHER, name: 'Maca', solid: true },
      { type: TileType.OR_TABLE, name: 'Mesa CC', solid: true },
      { type: TileType.MRI_MACHINE, name: 'MRI', solid: true },
      { type: TileType.SINK, name: 'Pia', solid: true },
      { type: TileType.SURGICAL_LIGHT, name: 'Foco', solid: true },
      { type: TileType.MAYO_STAND, name: 'Mesa Mayo', solid: true },
    ]
  },
  {
    category: 'Anestesia',
    icon: '💉',
    tiles: [
      { type: TileType.ANESTHESIA_MACHINE, name: 'Anestesia', solid: true },
      { type: TileType.VENTILATOR, name: 'Ventilador', solid: true },
      { type: TileType.PATIENT_MONITOR, name: 'Monitor', solid: true },
      { type: TileType.IV_STAND, name: 'Soro' },
      { type: TileType.SYRINGE_PUMP, name: 'Bomba Ser.' },
      { type: TileType.INFUSION_PUMP, name: 'Bomba Inf.' },
      { type: TileType.BIS_MONITOR, name: 'BIS', solid: true },
      { type: TileType.OXYGEN_TANK, name: 'O2' },
    ]
  },
  {
    category: 'Cardiaca',
    icon: '❤️',
    tiles: [
      { type: TileType.CEC_MACHINE, name: 'CEC', solid: true },
      { type: TileType.IABP, name: 'BIA', solid: true },
      { type: TileType.CELL_SAVER, name: 'Cell Saver', solid: true },
    ]
  },
  {
    category: 'Ortopedia',
    icon: '🦴',
    tiles: [
      { type: TileType.C_ARM, name: 'Arco C', solid: true },
      { type: TileType.ARTHROSCOPY_TOWER, name: 'Artrosc.', solid: true },
      { type: TileType.BONE_SAW, name: 'Serra' },
      { type: TileType.TRACTION_TABLE, name: 'Tracao', solid: true },
    ]
  },
  {
    category: 'Neuro',
    icon: '🧠',
    tiles: [
      { type: TileType.SURGICAL_MICROSCOPE, name: 'Microsc.', solid: true },
      { type: TileType.NEURO_NAVIGATION, name: 'Navegacao', solid: true },
      { type: TileType.CRANIOTOME, name: 'Craniot.' },
    ]
  },
  {
    category: 'Laparosc.',
    icon: '🔬',
    tiles: [
      { type: TileType.LAPAROSCOPY_TOWER, name: 'Torre Lap', solid: true },
      { type: TileType.ELECTROSURGICAL_UNIT, name: 'Bisturi E', solid: true },
      { type: TileType.INSUFFLATOR, name: 'Insuflador' },
    ]
  },
  {
    category: 'Oftalmo',
    icon: '👁️',
    tiles: [
      { type: TileType.PHACO_MACHINE, name: 'Faco', solid: true },
      { type: TileType.OPERATING_MICROSCOPE, name: 'Microsc.', solid: true },
    ]
  },
  {
    category: 'Urologia',
    icon: '💧',
    tiles: [
      { type: TileType.LITHOTRIPSY, name: 'Litotript.', solid: true },
      { type: TileType.CYSTOSCOPY_TOWER, name: 'Cistosc.', solid: true },
    ]
  },
  {
    category: 'Obstet.',
    icon: '👶',
    tiles: [
      { type: TileType.DELIVERY_BED, name: 'Parto', solid: true },
      { type: TileType.FETAL_MONITOR, name: 'CTG', solid: true },
      { type: TileType.INFANT_WARMER, name: 'Berco Aq.', solid: true },
    ]
  },
  {
    category: 'Emergencia',
    icon: '🚨',
    tiles: [
      { type: TileType.CRASH_CART, name: 'Emerg.', solid: true },
      { type: TileType.DEFIBRILLATOR, name: 'Desfib.', solid: true },
      { type: TileType.SUCTION_MACHINE, name: 'Aspirador' },
      { type: TileType.WARMER, name: 'Aquecedor' },
      { type: TileType.ULTRASOUND, name: 'USG', solid: true },
    ]
  },
  {
    category: 'Carrinhos',
    icon: '🛒',
    tiles: [
      { type: TileType.DRUG_CART, name: 'Medicam.', solid: true },
      { type: TileType.INTUBATION_CART, name: 'Via Aerea', solid: true },
      { type: TileType.KICK_BUCKET, name: 'Balde' },
      { type: TileType.HAMPER, name: 'Hamper' },
    ]
  },
  {
    category: 'Mesas',
    icon: '🪑',
    tiles: [
      { type: TileType.INSTRUMENT_TABLE, name: 'Instr.', solid: true },
      { type: TileType.BACK_TABLE, name: 'Aux.', solid: true },
      { type: TileType.SURGICAL_STOOL, name: 'Banco' },
    ]
  },
  {
    category: 'Copa/Ref.',
    icon: '☕',
    tiles: [
      { type: TileType.COFFEE_MACHINE, name: 'Cafe', solid: true },
      { type: TileType.MICROWAVE, name: 'Micro', solid: true },
      { type: TileType.REFRIGERATOR, name: 'Geladeira', solid: true },
      { type: TileType.WATER_DISPENSER, name: 'Bebedouro' },
      { type: TileType.DINING_TABLE, name: 'Mesa', solid: true },
    ]
  },
  {
    category: 'Moveis',
    icon: '🛋️',
    tiles: [
      { type: TileType.CHAIR_WAITING, name: 'Cadeira' },
      { type: TileType.DESK_RECEPTION, name: 'Balcao', solid: true },
      { type: TileType.COMPUTER_DESK, name: 'PC', solid: true },
      { type: TileType.CABINET, name: 'Armario', solid: true },
      { type: TileType.LOCKERS, name: 'Lockers', solid: true },
      { type: TileType.SOFA, name: 'Sofa', solid: true },
      { type: TileType.TV_SCREEN, name: 'TV' },
      { type: TileType.VENDING_MACHINE, name: 'Vending', solid: true },
      { type: TileType.PLANT, name: 'Planta', solid: true },
    ]
  },
];

// Função de desenho de tile (idêntica ao GameEngine)
const drawTile = (ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, size: number = 32) => {
  const S = size;
  const scale = size / 32;

  // 1. PISO BASE
  if (tile !== TileType.WALL) {
    const isOR = tile === TileType.FLOOR_OR;
    ctx.fillStyle = isOR ? COLORS.floorOR.base : COLORS.floor.base;
    ctx.fillRect(x, y, S, S);
    // Rejunte
    ctx.fillStyle = isOR ? COLORS.floorOR.line : COLORS.floor.line;
    ctx.fillRect(x, y + S - scale, S, scale);
    ctx.fillRect(x + S - scale, y, scale, S);
  }

  // 2. OBJETOS
  switch (tile) {
    case TileType.WALL: {
      ctx.fillStyle = COLORS.wall.base;
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = COLORS.wall.top;
      ctx.fillRect(x, y, S, 4 * scale);
      ctx.fillStyle = COLORS.wall.bottom;
      ctx.fillRect(x, y + S - 5 * scale, S, 5 * scale);
      ctx.fillStyle = COLORS.wall.dark;
      ctx.fillRect(x, y + S - 6 * scale, S, scale);
      break;
    }

    case TileType.DOOR: {
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(x + 2 * scale, y, S - 4 * scale, S);
      ctx.fillStyle = '#a08060';
      ctx.fillRect(x + 4 * scale, y + 2 * scale, S - 8 * scale, S - 2 * scale);
      ctx.fillStyle = '#907050';
      ctx.fillRect(x + 6 * scale, y + 4 * scale, S - 12 * scale, 10 * scale);
      ctx.fillRect(x + 6 * scale, y + 16 * scale, S - 12 * scale, 10 * scale);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x + S - 10 * scale, y + 14 * scale, 4 * scale, 4 * scale);
      break;
    }

    case TileType.BED: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 3 * scale, y + S - 3 * scale, S - 4 * scale, 3 * scale);
      ctx.fillStyle = COLORS.bed.frame;
      ctx.fillRect(x + 2 * scale, y + 6 * scale, S - 4 * scale, S - 8 * scale);
      ctx.fillStyle = COLORS.bed.sheet;
      ctx.fillRect(x + 4 * scale, y + 8 * scale, S - 8 * scale, S - 12 * scale);
      ctx.fillStyle = COLORS.bed.pillow;
      ctx.fillRect(x + 5 * scale, y + 2 * scale, S - 10 * scale, 8 * scale);
      ctx.fillStyle = '#b0a090';
      ctx.fillRect(x + 2 * scale, y, S - 4 * scale, 3 * scale);
      break;
    }

    case TileType.MRI_MACHINE: {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + S - 2 * scale, 13 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.metal.base;
      ctx.fillRect(x + 2 * scale, y + 4 * scale, S - 4 * scale, S - 8 * scale);
      ctx.fillStyle = COLORS.metal.light;
      ctx.fillRect(x + 2 * scale, y + 4 * scale, S - 4 * scale, 4 * scale);
      ctx.fillStyle = '#1a2030';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 16 * scale, 9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x + 4 * scale, y + 6 * scale, 3 * scale, 2 * scale);
      break;
    }

    case TileType.CABINET: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 5 * scale, y + S - 2 * scale, S - 6 * scale, 2 * scale);
      ctx.fillStyle = COLORS.wood.base;
      ctx.fillRect(x + 4 * scale, y + 2 * scale, S - 8 * scale, S - 4 * scale);
      ctx.fillStyle = COLORS.wood.light;
      ctx.fillRect(x + 4 * scale, y + 2 * scale, S - 8 * scale, 3 * scale);
      ctx.strokeStyle = '#6b5030';
      ctx.lineWidth = scale;
      ctx.strokeRect(x + 6 * scale, y + 7 * scale, S - 12 * scale, 9 * scale);
      ctx.strokeRect(x + 6 * scale, y + 18 * scale, S - 12 * scale, 9 * scale);
      ctx.fillStyle = '#d4a040';
      ctx.fillRect(x + 14 * scale, y + 10 * scale, 4 * scale, 3 * scale);
      ctx.fillRect(x + 14 * scale, y + 21 * scale, 4 * scale, 3 * scale);
      break;
    }

    case TileType.VENDING_MACHINE: {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 5 * scale, y + S - 2 * scale, S - 6 * scale, 2 * scale);
      ctx.fillStyle = '#d03030';
      ctx.fillRect(x + 4 * scale, y + scale, S - 8 * scale, S - 3 * scale);
      ctx.fillStyle = '#e04040';
      ctx.fillRect(x + 4 * scale, y + scale, S - 8 * scale, 2 * scale);
      ctx.fillStyle = '#40a0d0';
      ctx.fillRect(x + 6 * scale, y + 4 * scale, S - 12 * scale, 14 * scale);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + 7 * scale, y + 5 * scale, 4 * scale, 12 * scale);
      ctx.fillStyle = '#202020';
      ctx.fillRect(x + 6 * scale, y + 20 * scale, S - 12 * scale, 8 * scale);
      ctx.fillStyle = '#60ff60';
      ctx.fillRect(x + 8 * scale, y + 22 * scale, 3 * scale, 3 * scale);
      ctx.fillStyle = '#ff6060';
      ctx.fillRect(x + 13 * scale, y + 22 * scale, 3 * scale, 3 * scale);
      break;
    }

    case TileType.CHAIR_WAITING: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 9 * scale, y + S - 2 * scale, 14 * scale, 2 * scale);
      ctx.fillStyle = '#505860';
      ctx.fillRect(x + 10 * scale, y + 24 * scale, 3 * scale, 6 * scale);
      ctx.fillRect(x + 19 * scale, y + 24 * scale, 3 * scale, 6 * scale);
      ctx.fillStyle = '#5080d0';
      ctx.fillRect(x + 8 * scale, y + 16 * scale, 16 * scale, 8 * scale);
      ctx.fillStyle = '#4070c0';
      ctx.fillRect(x + 8 * scale, y + 6 * scale, 16 * scale, 10 * scale);
      ctx.fillStyle = '#6090e0';
      ctx.fillRect(x + 8 * scale, y + 6 * scale, 16 * scale, 2 * scale);
      break;
    }

    case TileType.DESK_RECEPTION: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 3 * scale, y + S - 2 * scale, S - 4 * scale, 2 * scale);
      ctx.fillStyle = COLORS.wood.base;
      ctx.fillRect(x + 2 * scale, y + 8 * scale, S - 4 * scale, S - 10 * scale);
      ctx.fillStyle = COLORS.wood.light;
      ctx.fillRect(x + 2 * scale, y + 6 * scale, S - 4 * scale, 4 * scale);
      ctx.fillStyle = COLORS.wood.dark;
      ctx.fillRect(x + 2 * scale, y + 10 * scale, S - 4 * scale, 2 * scale);
      break;
    }

    case TileType.COMPUTER_DESK: {
      ctx.fillStyle = COLORS.wood.base;
      ctx.fillRect(x + 2 * scale, y + 14 * scale, S - 4 * scale, S - 16 * scale);
      ctx.fillStyle = COLORS.wood.light;
      ctx.fillRect(x + 2 * scale, y + 14 * scale, S - 4 * scale, 2 * scale);
      ctx.fillStyle = '#303030';
      ctx.fillRect(x + 12 * scale, y + 10 * scale, 8 * scale, 4 * scale);
      ctx.fillStyle = '#202428';
      ctx.fillRect(x + 5 * scale, y, 22 * scale, 14 * scale);
      ctx.fillStyle = '#20a0e0';
      ctx.fillRect(x + 7 * scale, y + 2 * scale, 18 * scale, 10 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 9 * scale, y + 4 * scale, 10 * scale, 2 * scale);
      ctx.fillRect(x + 9 * scale, y + 7 * scale, 14 * scale, 2 * scale);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x + 14 * scale, y + 12 * scale, 3 * scale, scale);
      break;
    }

    case TileType.OR_TABLE: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 5 * scale, y + S - 2 * scale, S - 8 * scale, 2 * scale);
      ctx.fillStyle = COLORS.metal.dark;
      ctx.fillRect(x + 12 * scale, y + 18 * scale, 8 * scale, 10 * scale);
      ctx.fillStyle = COLORS.metal.light;
      ctx.fillRect(x + 3 * scale, y + 8 * scale, S - 6 * scale, 12 * scale);
      ctx.fillStyle = COLORS.metal.base;
      ctx.fillRect(x + 3 * scale, y + 8 * scale, S - 6 * scale, 2 * scale);
      ctx.fillRect(x + 3 * scale, y + 18 * scale, S - 6 * scale, 2 * scale);
      break;
    }

    case TileType.SINK: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 5 * scale, y + S - 2 * scale, S - 8 * scale, 2 * scale);
      ctx.fillStyle = COLORS.metal.light;
      ctx.fillRect(x + 4 * scale, y + 8 * scale, S - 8 * scale, S - 10 * scale);
      ctx.fillStyle = COLORS.metal.base;
      ctx.fillRect(x + 6 * scale, y + 10 * scale, S - 12 * scale, 14 * scale);
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(x + 8 * scale, y + 12 * scale, S - 16 * scale, 10 * scale);
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(x + 14 * scale, y + 2 * scale, 4 * scale, 10 * scale);
      ctx.fillRect(x + 12 * scale, y + 2 * scale, 8 * scale, 4 * scale);
      ctx.fillStyle = '#60c0ff';
      ctx.fillRect(x + 15 * scale, y + 11 * scale, 2 * scale, 3 * scale);
      break;
    }

    case TileType.PLANT: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + S - scale, 7 * scale, 3 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.plant.pot;
      ctx.beginPath();
      ctx.moveTo(x + 10 * scale, y + 20 * scale);
      ctx.lineTo(x + 9 * scale, y + S - 2 * scale);
      ctx.lineTo(x + 23 * scale, y + S - 2 * scale);
      ctx.lineTo(x + 22 * scale, y + 20 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x + 9 * scale, y + 18 * scale, 14 * scale, 3 * scale);
      ctx.fillStyle = COLORS.plant.leaf;
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 12 * scale, 7 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 12 * scale, y + 14 * scale, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 20 * scale, y + 14 * scale, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.plant.leafLight;
      ctx.beginPath();
      ctx.arc(x + 14 * scale, y + 10 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ============ EQUIPAMENTOS DE ANESTESIA ============

    case TileType.ANESTHESIA_MACHINE: {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + 4 * scale, y + S - 3 * scale, S - 6 * scale, 3 * scale);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(x + 4 * scale, y + 8 * scale, S - 8 * scale, S - 12 * scale);
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(x + 4 * scale, y + 6 * scale, S - 8 * scale, 4 * scale);
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(x + 6 * scale, y + 10 * scale, 12 * scale, 8 * scale);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(x + 7 * scale, y + 14 * scale);
      ctx.lineTo(x + 9 * scale, y + 14 * scale);
      ctx.lineTo(x + 10 * scale, y + 11 * scale);
      ctx.lineTo(x + 11 * scale, y + 16 * scale);
      ctx.lineTo(x + 12 * scale, y + 14 * scale);
      ctx.lineTo(x + 16 * scale, y + 14 * scale);
      ctx.stroke();
      ctx.fillStyle = '#4080ff';
      ctx.fillRect(x + 20 * scale, y + 8 * scale, 4 * scale, 10 * scale);
      ctx.fillStyle = '#ff8040';
      ctx.fillRect(x + 24 * scale, y + 8 * scale, 4 * scale, 10 * scale);
      break;
    }

    case TileType.IV_STAND: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + S - scale, 6 * scale, 2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 14 * scale, y + S - 4 * scale, 4 * scale, 4 * scale);
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(x + 15 * scale, y + 6 * scale, 2 * scale, S - 10 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 10 * scale, y + 4 * scale, 12 * scale, 2 * scale);
      ctx.fillStyle = '#e0f0ff';
      ctx.fillRect(x + 11 * scale, y + 8 * scale, 5 * scale, 8 * scale);
      ctx.fillStyle = '#80c0ff';
      ctx.fillRect(x + 12 * scale, y + 10 * scale, 3 * scale, 5 * scale);
      break;
    }

    case TileType.PATIENT_MONITOR: {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 5 * scale, y + S - 2 * scale, S - 8 * scale, 2 * scale);
      ctx.fillStyle = '#505050';
      ctx.fillRect(x + 12 * scale, y + 22 * scale, 8 * scale, 8 * scale);
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(x + 4 * scale, y + 2 * scale, S - 8 * scale, 20 * scale);
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 6 * scale, y + 4 * scale, S - 12 * scale, 14 * scale);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(x + 7 * scale, y + 8 * scale);
      ctx.lineTo(x + 10 * scale, y + 8 * scale);
      ctx.lineTo(x + 11 * scale, y + 5 * scale);
      ctx.lineTo(x + 12 * scale, y + 11 * scale);
      ctx.lineTo(x + 13 * scale, y + 8 * scale);
      ctx.lineTo(x + 20 * scale, y + 8 * scale);
      ctx.stroke();
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x + 21 * scale, y + 6 * scale, 3 * scale, 3 * scale);
      ctx.fillStyle = '#00ccff';
      ctx.fillRect(x + 21 * scale, y + 11 * scale, 3 * scale, 3 * scale);
      break;
    }

    case TileType.SYRINGE_PUMP: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 6 * scale, y + S - 2 * scale, S - 10 * scale, 2 * scale);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x + 4 * scale, y + 12 * scale, S - 8 * scale, 14 * scale);
      ctx.fillStyle = '#1a2a1a';
      ctx.fillRect(x + 6 * scale, y + 14 * scale, 10 * scale, 6 * scale);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x + 7 * scale, y + 15 * scale, 4 * scale, 4 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 6 * scale, y + 6 * scale, 16 * scale, 4 * scale);
      ctx.fillStyle = '#80c0ff';
      ctx.fillRect(x + 8 * scale, y + 7 * scale, 10 * scale, 2 * scale);
      ctx.fillStyle = '#4080ff';
      ctx.fillRect(x + 18 * scale, y + 14 * scale, 4 * scale, 3 * scale);
      break;
    }

    case TileType.VENTILATOR: {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + 4 * scale, y + S - 3 * scale, S - 6 * scale, 3 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 4 * scale, y + 8 * scale, S - 8 * scale, S - 12 * scale);
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 6 * scale, y + 10 * scale, S - 12 * scale, 10 * scale);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(x + 7 * scale, y + 14 * scale);
      ctx.lineTo(x + 10 * scale, y + 12 * scale);
      ctx.lineTo(x + 14 * scale, y + 12 * scale);
      ctx.lineTo(x + 17 * scale, y + 16 * scale);
      ctx.lineTo(x + 20 * scale, y + 14 * scale);
      ctx.stroke();
      ctx.fillStyle = '#80c0ff';
      ctx.fillRect(x + 14 * scale, y + 2 * scale, 4 * scale, 6 * scale);
      break;
    }

    case TileType.DRUG_CART: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 4 * scale, y + S - 2 * scale, S - 6 * scale, 2 * scale);
      ctx.fillStyle = '#4080c0';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, S - 8 * scale, S - 8 * scale);
      ctx.fillStyle = '#3070b0';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 6 * scale, y + (6 + i * 6) * scale, S - 12 * scale, 5 * scale);
      }
      ctx.fillStyle = '#303030';
      ctx.beginPath();
      ctx.arc(x + 8 * scale, y + S - 2 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.arc(x + 24 * scale, y + S - 2 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.DEFIBRILLATOR: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 6 * scale, y + S - 2 * scale, S - 10 * scale, 2 * scale);
      ctx.fillStyle = '#ff4040';
      ctx.fillRect(x + 4 * scale, y + 8 * scale, S - 8 * scale, S - 12 * scale);
      ctx.fillStyle = '#cc3030';
      ctx.fillRect(x + 4 * scale, y + 8 * scale, S - 8 * scale, 3 * scale);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + 6 * scale, y + 12 * scale, 12 * scale, 8 * scale);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(x + 7 * scale, y + 16 * scale);
      ctx.lineTo(x + 9 * scale, y + 16 * scale);
      ctx.lineTo(x + 10 * scale, y + 13 * scale);
      ctx.lineTo(x + 11 * scale, y + 18 * scale);
      ctx.lineTo(x + 12 * scale, y + 16 * scale);
      ctx.lineTo(x + 16 * scale, y + 16 * scale);
      ctx.stroke();
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(x + 8 * scale, y + 22 * scale, 8 * scale, 3 * scale);
      break;
    }

    case TileType.OXYGEN_TANK: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + S - scale, 5 * scale, 2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#40a040';
      ctx.fillRect(x + 10 * scale, y + 8 * scale, 12 * scale, S - 12 * scale);
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 8 * scale, 6 * scale, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 14 * scale, y + 2 * scale, 4 * scale, 6 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 13 * scale, y + 14 * scale, 6 * scale, 4 * scale);
      break;
    }

    case TileType.INTUBATION_CART: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 4 * scale, y + S - 2 * scale, S - 6 * scale, 2 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 4 * scale, y + 6 * scale, S - 8 * scale, S - 10 * scale);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, S - 8 * scale, 4 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 6 * scale, y + 5 * scale, 10 * scale, 2 * scale);
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(x + 6 * scale, y + 10 * scale, S - 12 * scale, 6 * scale);
      ctx.fillRect(x + 6 * scale, y + 18 * scale, S - 12 * scale, 6 * scale);
      ctx.fillStyle = '#303030';
      ctx.beginPath();
      ctx.arc(x + 8 * scale, y + S - 2 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.arc(x + 24 * scale, y + S - 2 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.SURGICAL_LIGHT: {
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 14 * scale, y, 4 * scale, 12 * scale);
      ctx.fillStyle = '#606060';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 8 * scale, y + 11 * scale, 16 * scale, 3 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + 20 * scale, 10 * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffcc';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + 20 * scale, 7 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + 20 * scale, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.STRETCHER: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 2 * scale, y + S - 2 * scale, S - 2 * scale, 2 * scale);
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 4 * scale, y + 20 * scale, S - 6 * scale, 4 * scale);
      ctx.fillRect(x + 6 * scale, y + 24 * scale, 3 * scale, 6 * scale);
      ctx.fillRect(x + 23 * scale, y + 24 * scale, 3 * scale, 6 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 2 * scale, y + 8 * scale, S - 4 * scale, 14 * scale);
      ctx.fillStyle = '#a0d0ff';
      ctx.fillRect(x + 4 * scale, y + 10 * scale, S - 8 * scale, 10 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, 8 * scale, 6 * scale);
      break;
    }

    case TileType.MAYO_STAND: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + S - scale, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#707070';
      ctx.fillRect(x + 12 * scale, y + S - 4 * scale, 8 * scale, 4 * scale);
      ctx.fillStyle = '#909090';
      ctx.fillRect(x + 14 * scale, y + 14 * scale, 4 * scale, S - 18 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 4 * scale, y + 10 * scale, S - 8 * scale, 6 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 6 * scale, y + 12 * scale, 3 * scale, 2 * scale);
      ctx.fillRect(x + 10 * scale, y + 12 * scale, 5 * scale, 2 * scale);
      ctx.fillRect(x + 16 * scale, y + 12 * scale, 4 * scale, 2 * scale);
      break;
    }

    case TileType.SUCTION_MACHINE: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 6 * scale, y + S - 2 * scale, S - 10 * scale, 2 * scale);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x + 6 * scale, y + 10 * scale, S - 12 * scale, S - 14 * scale);
      ctx.fillStyle = '#e0f0ff';
      ctx.fillRect(x + 8 * scale, y + 14 * scale, S - 16 * scale, 10 * scale);
      ctx.fillStyle = '#ffcccc';
      ctx.fillRect(x + 9 * scale, y + 18 * scale, S - 18 * scale, 5 * scale);
      ctx.fillStyle = '#404040';
      ctx.fillRect(x + 8 * scale, y + 10 * scale, S - 16 * scale, 3 * scale);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x + 18 * scale, y + 11 * scale, 3 * scale, 2 * scale);
      break;
    }

    case TileType.INFUSION_PUMP: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 6 * scale, y + S - 2 * scale, S - 10 * scale, 2 * scale);
      ctx.fillStyle = '#f0f0e8';
      ctx.fillRect(x + 4 * scale, y + 6 * scale, S - 8 * scale, S - 10 * scale);
      ctx.fillStyle = '#1a2a1a';
      ctx.fillRect(x + 6 * scale, y + 8 * scale, 12 * scale, 8 * scale);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x + 8 * scale, y + 10 * scale, 6 * scale, 4 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 20 * scale, y + 8 * scale, 4 * scale, 12 * scale);
      ctx.fillStyle = '#80c0ff';
      ctx.fillRect(x + 21 * scale, y + 14 * scale, 2 * scale, 5 * scale);
      ctx.fillStyle = '#4080ff';
      ctx.fillRect(x + 6 * scale, y + 18 * scale, 5 * scale, 4 * scale);
      ctx.fillStyle = '#ff4040';
      ctx.fillRect(x + 13 * scale, y + 18 * scale, 5 * scale, 4 * scale);
      break;
    }

    case TileType.CRASH_CART: {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 4 * scale, y + S - 2 * scale, S - 6 * scale, 2 * scale);
      ctx.fillStyle = '#cc3030';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, S - 8 * scale, S - 8 * scale);
      ctx.fillStyle = '#e04040';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, S - 8 * scale, 3 * scale);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#b02020';
        ctx.fillRect(x + 6 * scale, y + (9 + i * 7) * scale, S - 12 * scale, 6 * scale);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 12 * scale, y + (11 + i * 7) * scale, 8 * scale, 2 * scale);
      }
      ctx.fillStyle = '#303030';
      ctx.beginPath();
      ctx.arc(x + 8 * scale, y + S - 2 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.arc(x + 24 * scale, y + S - 2 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.WARMER: {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 8 * scale, y + S - 2 * scale, S - 14 * scale, 2 * scale);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x + 6 * scale, y + 8 * scale, S - 12 * scale, S - 12 * scale);
      ctx.fillStyle = '#ff8040';
      ctx.fillRect(x + 8 * scale, y + 12 * scale, S - 16 * scale, 10 * scale);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x + 10 * scale, y + 14 * scale, S - 20 * scale, 2 * scale);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + 10 * scale, y + 8 * scale, 8 * scale, 4 * scale);
      ctx.fillStyle = '#ff4040';
      ctx.fillRect(x + 11 * scale, y + 9 * scale, 6 * scale, 2 * scale);
      break;
    }

    case TileType.BIS_MONITOR: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 8 * scale, y + S - 2 * scale, S - 14 * scale, 2 * scale);
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(x + 6 * scale, y + 6 * scale, S - 12 * scale, S - 10 * scale);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(x + 8 * scale, y + 8 * scale, S - 16 * scale, 12 * scale);
      ctx.fillStyle = '#00ccff';
      ctx.fillRect(x + 10 * scale, y + 10 * scale, 8 * scale, 8 * scale);
      ctx.fillStyle = '#404040';
      ctx.fillRect(x + 20 * scale, y + 10 * scale, 3 * scale, 8 * scale);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x + 20 * scale, y + 14 * scale, 3 * scale, 4 * scale);
      break;
    }

    case TileType.ULTRASOUND: {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 6 * scale, y + S - 2 * scale, S - 10 * scale, 2 * scale);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(x + 4 * scale, y + 10 * scale, S - 8 * scale, S - 14 * scale);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(x + 6 * scale, y + 12 * scale, S - 12 * scale, 10 * scale);
      ctx.fillStyle = '#203040';
      ctx.fillRect(x + 8 * scale, y + 14 * scale, S - 16 * scale, 6 * scale);
      ctx.fillStyle = '#406080';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 17 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#404040';
      ctx.fillRect(x + 14 * scale, y + 4 * scale, 4 * scale, 6 * scale);
      ctx.fillStyle = '#606060';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 4 * scale, 3 * scale, Math.PI, 0);
      ctx.fill();
      break;
    }

    // ============ EQUIPAMENTOS DE ESPECIALIDADES ============

    case TileType.CEC_MACHINE: {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + 2 * scale, y + S - 3 * scale, S - 2 * scale, 3 * scale);
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(x + 2 * scale, y + 4 * scale, S - 4 * scale, S - 8 * scale);
      ctx.fillStyle = '#cc3030';
      ctx.beginPath();
      ctx.arc(x + 10 * scale, y + 12 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.arc(x + 22 * scale, y + 12 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4080c0';
      ctx.fillRect(x + 18 * scale, y + 20 * scale, 8 * scale, 6 * scale);
      break;
    }

    case TileType.IABP: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 6 * scale, y + 8 * scale, S - 12 * scale, S - 12 * scale);
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 8 * scale, y + 10 * scale, S - 16 * scale, 10 * scale);
      ctx.strokeStyle = '#ff4040';
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(x + 9 * scale, y + 15 * scale);
      ctx.lineTo(x + 14 * scale, y + 12 * scale);
      ctx.lineTo(x + 18 * scale, y + 16 * scale);
      ctx.stroke();
      break;
    }

    case TileType.CELL_SAVER: {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(x + 6 * scale, y + 6 * scale, S - 12 * scale, S - 10 * scale);
      ctx.fillStyle = '#cc4040';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 16 * scale, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.C_ARM: {
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 14 * scale, y + 14 * scale, 4 * scale, S - 18 * scale);
      ctx.strokeStyle = '#a0a0a0';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 12 * scale, 12 * scale, Math.PI * 0.7, Math.PI * 2.3);
      ctx.stroke();
      ctx.fillStyle = '#505050';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, 8 * scale, 6 * scale);
      break;
    }

    case TileType.ARTHROSCOPY_TOWER: {
      ctx.fillStyle = '#303030';
      ctx.fillRect(x + 6 * scale, y + 4 * scale, S - 12 * scale, S - 8 * scale);
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(x + 8 * scale, y + 6 * scale, S - 16 * scale, 10 * scale);
      ctx.fillStyle = '#ff9090';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 11 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.BONE_SAW: {
      ctx.fillStyle = '#4080c0';
      ctx.fillRect(x + 8 * scale, y + 10 * scale, S - 16 * scale, 12 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 14 * scale, y + 4 * scale, 4 * scale, 8 * scale);
      break;
    }

    case TileType.TRACTION_TABLE: {
      ctx.fillStyle = '#4080a0';
      ctx.fillRect(x + 2 * scale, y + 8 * scale, S - 4 * scale, 14 * scale);
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 2 * scale, y + 18 * scale, 6 * scale, 3 * scale);
      ctx.fillRect(x + 24 * scale, y + 18 * scale, 6 * scale, 3 * scale);
      break;
    }

    case TileType.SURGICAL_MICROSCOPE: {
      ctx.fillStyle = '#505050';
      ctx.fillRect(x + 8 * scale, y + S - 4 * scale, 16 * scale, 4 * scale);
      ctx.fillStyle = '#707070';
      ctx.fillRect(x + 14 * scale, y + 12 * scale, 4 * scale, S - 16 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 4 * scale, y + 2 * scale, 12 * scale, 10 * scale);
      ctx.fillStyle = '#4080c0';
      ctx.beginPath();
      ctx.arc(x + 10 * scale, y + 10 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.NEURO_NAVIGATION: {
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(x + 6 * scale, y + 6 * scale, S - 12 * scale, S - 10 * scale);
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 8 * scale, y + 8 * scale, S - 16 * scale, 12 * scale);
      ctx.fillStyle = '#ff8080';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 14 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + 11 * scale, y + 3 * scale, 2 * scale, 2 * scale);
      ctx.fillRect(x + 19 * scale, y + 3 * scale, 2 * scale, 2 * scale);
      break;
    }

    case TileType.CRANIOTOME: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 6 * scale, y + 14 * scale, S - 12 * scale, 12 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 10 * scale, y + 4 * scale, 12 * scale, 6 * scale);
      break;
    }

    case TileType.LAPAROSCOPY_TOWER: {
      ctx.fillStyle = '#303030';
      ctx.fillRect(x + 6 * scale, y + 2 * scale, S - 12 * scale, S - 6 * scale);
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(x + 8 * scale, y + 4 * scale, S - 16 * scale, 10 * scale);
      ctx.fillStyle = '#ff9090';
      ctx.fillRect(x + 10 * scale, y + 6 * scale, S - 20 * scale, 6 * scale);
      break;
    }

    case TileType.ELECTROSURGICAL_UNIT: {
      ctx.fillStyle = '#e8e8e0';
      ctx.fillRect(x + 4 * scale, y + 10 * scale, S - 8 * scale, S - 14 * scale);
      ctx.fillStyle = '#1a2a1a';
      ctx.fillRect(x + 8 * scale, y + 14 * scale, 6 * scale, 4 * scale);
      ctx.fillRect(x + 16 * scale, y + 14 * scale, 6 * scale, 4 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 6 * scale, y + 4 * scale, 16 * scale, 4 * scale);
      break;
    }

    case TileType.INSUFFLATOR: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 6 * scale, y + 10 * scale, S - 12 * scale, S - 14 * scale);
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(x + 8 * scale, y + 12 * scale, 10 * scale, 6 * scale);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x + 10 * scale, y + 14 * scale, 6 * scale, 2 * scale);
      break;
    }

    case TileType.PHACO_MACHINE: {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(x + 4 * scale, y + 8 * scale, S - 8 * scale, S - 12 * scale);
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 6 * scale, y + 10 * scale, S - 12 * scale, 10 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 15 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4080c0';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 15 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.OPERATING_MICROSCOPE: {
      ctx.fillStyle = '#606060';
      ctx.fillRect(x + 10 * scale, y + S - 4 * scale, 12 * scale, 4 * scale);
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(x + 6 * scale, y + 4 * scale, 12 * scale, 10 * scale);
      ctx.fillStyle = '#4080c0';
      ctx.beginPath();
      ctx.arc(x + 12 * scale, y + 12 * scale, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.LITHOTRIPSY: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 4 * scale, y + 16 * scale, S - 8 * scale, 12 * scale);
      ctx.fillStyle = '#4080c0';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 12 * scale, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#80c0e0';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.CYSTOSCOPY_TOWER: {
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(x + 6 * scale, y + 4 * scale, S - 12 * scale, S - 8 * scale);
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 8 * scale, y + 6 * scale, S - 16 * scale, 10 * scale);
      ctx.fillStyle = '#ffcccc';
      ctx.beginPath();
      ctx.arc(x + 16 * scale, y + 11 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.DELIVERY_BED: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 2 * scale, y + 8 * scale, S - 4 * scale, S - 12 * scale);
      ctx.fillStyle = '#f0a0c0';
      ctx.fillRect(x + 4 * scale, y + 10 * scale, S - 8 * scale, S - 16 * scale);
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 2 * scale, y + 20 * scale, 4 * scale, 6 * scale);
      ctx.fillRect(x + 26 * scale, y + 20 * scale, 4 * scale, 6 * scale);
      break;
    }

    case TileType.FETAL_MONITOR: {
      ctx.fillStyle = '#f0f0e8';
      ctx.fillRect(x + 4 * scale, y + 6 * scale, S - 8 * scale, S - 10 * scale);
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(x + 6 * scale, y + 8 * scale, S - 12 * scale, 12 * scale);
      ctx.strokeStyle = '#ff80a0';
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(x + 7 * scale, y + 12 * scale);
      ctx.lineTo(x + 11 * scale, y + 10 * scale);
      ctx.lineTo(x + 12 * scale, y + 14 * scale);
      ctx.lineTo(x + 18 * scale, y + 12 * scale);
      ctx.stroke();
      break;
    }

    case TileType.INFANT_WARMER: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 4 * scale, y + 18 * scale, S - 8 * scale, 10 * scale);
      ctx.fillStyle = '#80c0ff';
      ctx.fillRect(x + 6 * scale, y + 20 * scale, S - 12 * scale, 6 * scale);
      ctx.fillStyle = '#ff8040';
      ctx.fillRect(x + 8 * scale, y + 6 * scale, S - 16 * scale, 4 * scale);
      ctx.fillStyle = '#ff4020';
      ctx.fillRect(x + 10 * scale, y + 7 * scale, 3 * scale, 2 * scale);
      ctx.fillRect(x + 15 * scale, y + 7 * scale, 3 * scale, 2 * scale);
      break;
    }

    case TileType.SURGICAL_STOOL: {
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 14 * scale, y + 14 * scale, 4 * scale, S - 18 * scale);
      ctx.fillStyle = '#404040';
      ctx.beginPath();
      ctx.ellipse(x + 16 * scale, y + 12 * scale, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.KICK_BUCKET: {
      ctx.fillStyle = '#707070';
      ctx.fillRect(x + 10 * scale, y + S - 4 * scale, 12 * scale, 4 * scale);
      ctx.fillStyle = '#a0a0a0';
      ctx.beginPath();
      ctx.moveTo(x + 8 * scale, y + 8 * scale);
      ctx.lineTo(x + 6 * scale, y + S - 4 * scale);
      ctx.lineTo(x + 26 * scale, y + S - 4 * scale);
      ctx.lineTo(x + 24 * scale, y + 8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4080c0';
      ctx.fillRect(x + 10 * scale, y + 10 * scale, 12 * scale, S - 16 * scale);
      break;
    }

    case TileType.HAMPER: {
      ctx.fillStyle = '#4080c0';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, S - 8 * scale, 18 * scale);
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(x + 3 * scale, y + 2 * scale, S - 6 * scale, 3 * scale);
      break;
    }

    case TileType.INSTRUMENT_TABLE: {
      ctx.fillStyle = '#707070';
      ctx.fillRect(x + 6 * scale, y + 20 * scale, 4 * scale, 10 * scale);
      ctx.fillRect(x + 22 * scale, y + 20 * scale, 4 * scale, 10 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 4 * scale, y + 16 * scale, S - 8 * scale, 6 * scale);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 6 * scale, y + 17 * scale, 4 * scale, scale);
      ctx.fillRect(x + 12 * scale, y + 17 * scale, 6 * scale, scale);
      break;
    }

    case TileType.BACK_TABLE: {
      ctx.fillStyle = '#606060';
      ctx.fillRect(x + 4 * scale, y + 22 * scale, 4 * scale, 8 * scale);
      ctx.fillRect(x + 24 * scale, y + 22 * scale, 4 * scale, 8 * scale);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x + 2 * scale, y + 18 * scale, S - 4 * scale, 6 * scale);
      ctx.fillStyle = '#40a080';
      ctx.fillRect(x + 4 * scale, y + 18 * scale, S - 8 * scale, 4 * scale);
      break;
    }

    case TileType.COFFEE_MACHINE: {
      ctx.fillStyle = '#303030';
      ctx.fillRect(x + 6 * scale, y + 6 * scale, S - 12 * scale, S - 10 * scale);
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(x + 10 * scale, y + 10 * scale, 8 * scale, 4 * scale);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x + 11 * scale, y + 11 * scale, 6 * scale, 2 * scale);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x + 13 * scale, y + 23 * scale, 6 * scale, 3 * scale);
      break;
    }

    case TileType.MICROWAVE: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 4 * scale, y + 10 * scale, S - 8 * scale, S - 14 * scale);
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(x + 6 * scale, y + 12 * scale, 14 * scale, 10 * scale);
      ctx.fillStyle = '#ffff80';
      ctx.fillRect(x + 8 * scale, y + 14 * scale, 10 * scale, 6 * scale);
      break;
    }

    case TileType.REFRIGERATOR: {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x + 4 * scale, y + 2 * scale, S - 8 * scale, S - 6 * scale);
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(x + 4 * scale, y + 12 * scale, S - 8 * scale, 2 * scale);
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(x + 22 * scale, y + 6 * scale, 2 * scale, 4 * scale);
      ctx.fillRect(x + 22 * scale, y + 18 * scale, 2 * scale, 8 * scale);
      break;
    }

    case TileType.WATER_DISPENSER: {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x + 8 * scale, y + 18 * scale, S - 16 * scale, 10 * scale);
      ctx.fillStyle = '#80c0ff';
      ctx.fillRect(x + 10 * scale, y + 2 * scale, S - 20 * scale, 16 * scale);
      ctx.fillStyle = '#4080c0';
      ctx.fillRect(x + 12 * scale, y, S - 24 * scale, 3 * scale);
      break;
    }

    case TileType.DINING_TABLE: {
      ctx.fillStyle = '#707070';
      ctx.fillRect(x + 6 * scale, y + 22 * scale, 4 * scale, 8 * scale);
      ctx.fillRect(x + 22 * scale, y + 22 * scale, 4 * scale, 8 * scale);
      ctx.fillStyle = COLORS.wood.base;
      ctx.fillRect(x + 2 * scale, y + 18 * scale, S - 4 * scale, 6 * scale);
      ctx.fillStyle = COLORS.wood.light;
      ctx.fillRect(x + 2 * scale, y + 16 * scale, S - 4 * scale, 3 * scale);
      break;
    }

    case TileType.LOCKERS: {
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 4 * scale, y + 2 * scale, S - 8 * scale, S - 6 * scale);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + (6 + i * 8) * scale, y + 4 * scale, 6 * scale, S - 10 * scale);
      }
      break;
    }

    case TileType.SOFA: {
      ctx.fillStyle = '#4080a0';
      ctx.fillRect(x + 4 * scale, y + 14 * scale, S - 8 * scale, 10 * scale);
      ctx.fillStyle = '#3070a0';
      ctx.fillRect(x + 4 * scale, y + 6 * scale, S - 8 * scale, 10 * scale);
      ctx.fillStyle = '#306090';
      ctx.fillRect(x + 2 * scale, y + 10 * scale, 4 * scale, 14 * scale);
      ctx.fillRect(x + 26 * scale, y + 10 * scale, 4 * scale, 14 * scale);
      break;
    }

    case TileType.TV_SCREEN: {
      ctx.fillStyle = '#404040';
      ctx.fillRect(x + 14 * scale, y, 4 * scale, 6 * scale);
      ctx.fillStyle = '#202020';
      ctx.fillRect(x + 4 * scale, y + 4 * scale, S - 8 * scale, S - 14 * scale);
      ctx.fillStyle = '#1a2a3a';
      ctx.fillRect(x + 6 * scale, y + 6 * scale, S - 12 * scale, S - 18 * scale);
      ctx.fillStyle = '#4080c0';
      ctx.fillRect(x + 8 * scale, y + 8 * scale, 12 * scale, 6 * scale);
      break;
    }
  }
};

const MapEditor: React.FC<MapEditorProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentMap, setCurrentMap] = useState<MapData>(() =>
    mapStorage.getCurrentMap() || mapStorage.createEmptyMap('Novo Mapa')
  );
  const [selectedTile, setSelectedTile] = useState<TileType>(TileType.FLOOR);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [savedMaps, setSavedMaps] = useState<MapData[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [mapName, setMapName] = useState(currentMap.name);

  // Carrega mapas salvos
  useEffect(() => {
    setSavedMaps(mapStorage.getAllMaps());
  }, []);

  // Salva mapa atual
  useEffect(() => {
    mapStorage.setCurrentMap(currentMap);
  }, [currentMap]);

  // Renderiza mapa
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, tiles } = currentMap;
    const tileSize = TILE_SIZE * zoom;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);

    // Desenha tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y]?.[x] ?? TileType.FLOOR;
        const px = x * tileSize;
        const py = y * tileSize;

        drawTile(ctx, tile, px, py, tileSize);

        // Grid
        if (showGrid) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, tileSize, tileSize);
        }
      }
    }

    // Borda do mapa
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width * tileSize, height * tileSize);

    ctx.restore();
  }, [currentMap, zoom, offset, showGrid]);

  useEffect(() => {
    render();
  }, [render]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  // Mouse handlers
  const getTileAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left - offset.x;
    const canvasY = clientY - rect.top - offset.y;

    const tileSize = TILE_SIZE * zoom;
    const tileX = Math.floor(canvasX / tileSize);
    const tileY = Math.floor(canvasY / tileSize);

    if (tileX >= 0 && tileX < currentMap.width && tileY >= 0 && tileY < currentMap.height) {
      return { x: tileX, y: tileY };
    }
    return null;
  };

  const placeTile = (tileX: number, tileY: number) => {
    setCurrentMap(prev => {
      const newTiles = prev.tiles.map(row => [...row]);
      if (newTiles[tileY] && newTiles[tileY][tileX] !== undefined) {
        newTiles[tileY][tileX] = selectedTile;
      }
      return { ...prev, tiles: newTiles, updatedAt: Date.now() };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
      setIsDrawing(true);
      const tile = getTileAt(e.clientX, e.clientY);
      if (tile) placeTile(tile.x, tile.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.x;
      const dy = e.clientY - lastPanPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPos({ x: e.clientX, y: e.clientY });
    } else if (isDrawing) {
      const tile = getTileAt(e.clientX, e.clientY);
      if (tile) placeTile(tile.x, tile.y);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  // Save/Load
  const handleSave = () => {
    const mapToSave = { ...currentMap, name: mapName };
    mapStorage.saveMap(mapToSave);
    setCurrentMap(mapToSave);
    setSavedMaps(mapStorage.getAllMaps());
    setShowSaveDialog(false);
  };

  const handleLoad = (map: MapData) => {
    setCurrentMap(map);
    setMapName(map.name);
    setShowLoadDialog(false);
  };

  const handleNew = () => {
    const newMap = mapStorage.createEmptyMap('Novo Mapa');
    setCurrentMap(newMap);
    setMapName(newMap.name);
  };

  const handleExport = () => {
    const json = mapStorage.exportMap(currentMap);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const map = mapStorage.importMap(json);
      if (map) {
        setCurrentMap(map);
        setMapName(map.name);
      }
    };
    reader.readAsText(file);
  };

  const currentTiles = TILE_CATEGORIES[selectedCategory]?.tiles || [];

  // Componente de preview do tile
  const TilePreview: React.FC<{ type: TileType; size: number; selected?: boolean }> = ({ type, size, selected }) => {
    const previewRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = previewRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);
      drawTile(ctx, type, 0, 0, size);
    }, [type, size]);

    return (
      <canvas
        ref={previewRef}
        width={size}
        height={size}
        className={`rounded ${selected ? 'ring-2 ring-cyan-400' : ''}`}
        style={{ imageRendering: 'pixelated' }}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-cyan-500/30">
        <div className="flex items-center gap-4">
          <h1 className="text-cyan-400 text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            EDITOR DE MAPAS
          </h1>
          <span className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">
            {currentMap.name} ({currentMap.width}x{currentMap.height})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleNew} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded text-slate-200 text-xs">
            Novo
          </button>
          <button onClick={() => setShowSaveDialog(true)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-xs">
            Salvar
          </button>
          <button onClick={() => setShowLoadDialog(true)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded text-slate-200 text-xs">
            Carregar
          </button>
          <button onClick={handleExport} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded text-slate-200 text-xs">
            Exportar
          </button>
          <label className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded text-slate-200 text-xs cursor-pointer">
            Importar
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <label className="flex items-center gap-2 text-slate-300 text-xs">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="rounded" />
            Grid
          </label>

          <span className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">
            {Math.round(zoom * 100)}%
          </span>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <button onClick={onClose} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-white text-xs">
            Fechar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Palette Sidebar */}
        <div className="w-56 bg-slate-900/95 border-r border-slate-700 flex flex-col">
          {/* Category Tabs */}
          <div className="flex border-b border-slate-700">
            {TILE_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(idx)}
                className={`flex-1 py-2 text-center transition-all ${
                  selectedCategory === idx
                    ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
                title={cat.category}
              >
                <span className="text-lg">{cat.icon}</span>
              </button>
            ))}
          </div>

          {/* Category Title */}
          <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700">
            <h3 className="text-cyan-400 text-xs font-bold">
              {TILE_CATEGORIES[selectedCategory]?.category}
            </h3>
          </div>

          {/* Tiles Grid com Preview Real */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {currentTiles.map(tile => (
                <button
                  key={tile.type}
                  onClick={() => setSelectedTile(tile.type)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    selectedTile === tile.type
                      ? 'bg-slate-700 ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900'
                      : 'bg-slate-800/50 hover:bg-slate-700/50'
                  }`}
                >
                  <TilePreview type={tile.type} size={40} selected={selectedTile === tile.type} />
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    {tile.name}
                  </span>
                  {selectedTile === tile.type && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-slate-900">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Tile Preview */}
          <div className="p-3 bg-slate-800/50 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <TilePreview type={selectedTile} size={48} />
              <div>
                <p className="text-white text-sm font-medium">
                  {TILE_CATEGORIES.flatMap(c => c.tiles).find(t => t.type === selectedTile)?.name}
                </p>
                <p className="text-slate-500 text-xs">Selecionado</p>
              </div>
            </div>
          </div>

          {/* Controls Info */}
          <div className="p-3 bg-slate-900 border-t border-slate-700">
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Click = Pintar | Drag = Area<br/>
              Alt+Drag = Mover | Scroll = Zoom
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden cursor-crosshair bg-slate-950"
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 w-96 shadow-2xl">
            <h2 className="text-cyan-400 text-sm mb-4" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              SALVAR MAPA
            </h2>
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Nome do mapa"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white mb-4 focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 w-96 max-h-[70vh] overflow-y-auto shadow-2xl">
            <h2 className="text-cyan-400 text-sm mb-4" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              CARREGAR MAPA
            </h2>

            {savedMaps.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">
                Nenhum mapa salvo ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {savedMaps.map(map => (
                  <button
                    key={map.id}
                    onClick={() => handleLoad(map)}
                    className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-500/50 rounded-lg text-left transition-all"
                  >
                    <p className="text-white text-sm font-medium">{map.name}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {map.width}x{map.height} • {new Date(map.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapEditor;
