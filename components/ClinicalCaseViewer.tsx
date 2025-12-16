import React, { useState, useEffect } from 'react';
import {
  clinicalCaseManager,
  ClinicalCase,
  CaseProgress,
  DecisionPoint,
  VitalSigns,
} from '../services/clinicalCases';

interface ClinicalCaseViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'list' | 'case' | 'decision' | 'result';

// Monitor de sinais vitais
const VitalsMonitor: React.FC<{ vitals: VitalSigns }> = ({ vitals }) => {
  return (
    <div className="bg-slate-900 border border-emerald-400/30 rounded p-3 font-mono">
      <div className="text-[8px] text-emerald-400 mb-2 uppercase tracking-wider">Monitor</div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">HR:</span>
          <span className="text-white">{vitals.heartRate} bpm</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">SpO2:</span>
          <span className="text-white">{vitals.spO2}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400">PA:</span>
          <span className="text-white">{vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400">Temp:</span>
          <span className="text-white">{vitals.temperature}C</span>
        </div>
      </div>
    </div>
  );
};

// Card de caso
const CaseCard: React.FC<{
  clinicalCase: ClinicalCase;
  onSelect: () => void;
}> = ({ clinicalCase, onSelect }) => {
  const difficultyColors = {
    beginner: 'border-green-400 text-green-400',
    intermediate: 'border-yellow-400 text-yellow-400',
    advanced: 'border-orange-400 text-orange-400',
    expert: 'border-red-400 text-red-400',
  };

  const specialtyIcons: Record<string, string> = {
    general: '🔪',
    cardiac: '❤️',
    orthopedic: '🦴',
    neurosurgery: '🧠',
    urology: '💧',
    obstetric: '👶',
    pediatric: '🧒',
    vascular: '🩸',
    thoracic: '🫁',
    ophthalmology: '👁️',
    otorhinolaryngology: '👂',
  };

  return (
    <div
      onClick={onSelect}
      className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 cursor-pointer hover:border-cyan-400/50 transition-all hover:bg-slate-800/70"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{specialtyIcons[clinicalCase.specialty] || '🏥'}</span>
          <div>
            <h3 className="text-amber-300 text-[11px] font-semibold">{clinicalCase.title}</h3>
            <p className="text-slate-400 text-[9px]">{clinicalCase.procedure}</p>
          </div>
        </div>
        <span className={`text-[8px] px-2 py-1 border rounded ${difficultyColors[clinicalCase.difficulty]}`}>
          {clinicalCase.difficulty.toUpperCase()}
        </span>
      </div>

      <div className="text-[9px] text-slate-300 mb-2">
        <span className="text-slate-500">Paciente:</span> {clinicalCase.patient.name}, {clinicalCase.patient.age}a, ASA {clinicalCase.patient.asa}
      </div>

      <div className="flex items-center justify-between text-[8px]">
        <span className="text-slate-500">
          ⏱️ {clinicalCase.estimatedDuration}min
        </span>
        <span className="text-slate-500">
          📚 {clinicalCase.learningObjectives.length} objetivos
        </span>
      </div>
    </div>
  );
};

// Viewer de decisao
const DecisionViewer: React.FC<{
  decision: DecisionPoint;
  onSelect: (optionId: string) => void;
  selectedOption?: string;
  showFeedback: boolean;
}> = ({ decision, onSelect, selectedOption, showFeedback }) => {
  return (
    <div className="bg-slate-800/50 border border-amber-400/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">❓</span>
        <h3 className="text-amber-300 text-[11px] font-semibold">{decision.question}</h3>
      </div>

      <p className="text-slate-300 text-[9px] mb-4 bg-slate-900/50 p-2 rounded border-l-2 border-cyan-400">
        {decision.context}
      </p>

      <div className="space-y-2">
        {decision.options.map((option, index) => {
          const isSelected = selectedOption === option.id;
          const showResult = showFeedback && isSelected;

          let borderColor = 'border-slate-600';
          let bgColor = 'bg-slate-800/30';

          if (showFeedback) {
            if (option.isCorrect) {
              borderColor = 'border-emerald-400';
              bgColor = 'bg-emerald-900/20';
            } else if (isSelected) {
              borderColor = 'border-red-400';
              bgColor = 'bg-red-900/20';
            }
          } else if (isSelected) {
            borderColor = 'border-cyan-400';
            bgColor = 'bg-cyan-900/20';
          }

          return (
            <div key={option.id}>
              <button
                onClick={() => !showFeedback && onSelect(option.id)}
                disabled={showFeedback}
                className={`w-full text-left p-3 rounded border ${borderColor} ${bgColor} transition-all ${!showFeedback ? 'hover:border-cyan-400/50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 text-[9px]">{String.fromCharCode(65 + index)}.</span>
                  <span className="text-white text-[10px]">{option.text}</span>
                </div>
              </button>
              {showResult && (
                <div className={`mt-1 p-2 rounded text-[9px] ${option.isCorrect ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                  {option.isCorrect ? '✓ ' : '✗ '}{option.feedback}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {decision.hints && decision.hints.length > 0 && !showFeedback && (
        <div className="mt-4 text-[8px] text-slate-500">
          💡 Dica: {decision.hints[0]}
        </div>
      )}
    </div>
  );
};

const ClinicalCaseViewer: React.FC<ClinicalCaseViewerProps> = ({ isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);
  const [progress, setProgress] = useState<CaseProgress | null>(null);
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>();
  const [showFeedback, setShowFeedback] = useState(false);
  const [finalResult, setFinalResult] = useState<{ score: number; correctPercentage: number } | null>(null);

  const cases = clinicalCaseManager.getAllCases();

  const handleSelectCase = (clinicalCase: ClinicalCase) => {
    setSelectedCase(clinicalCase);
    setViewMode('case');
  };

  const handleStartCase = () => {
    if (!selectedCase) return;
    const newProgress = clinicalCaseManager.startCase(selectedCase.id);
    setProgress(newProgress);
    setCurrentDecisionIndex(0);
    setSelectedOption(undefined);
    setShowFeedback(false);
    setViewMode('decision');
  };

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleConfirmDecision = () => {
    if (!selectedCase || !selectedOption) return;

    const decisions = selectedCase.preOpDecisions;
    const currentDecision = decisions[currentDecisionIndex];

    clinicalCaseManager.recordDecision(currentDecision.id, selectedOption);
    setShowFeedback(true);
  };

  const handleNextDecision = () => {
    if (!selectedCase) return;

    const decisions = selectedCase.preOpDecisions;
    if (currentDecisionIndex < decisions.length - 1) {
      setCurrentDecisionIndex(prev => prev + 1);
      setSelectedOption(undefined);
      setShowFeedback(false);
    } else {
      // Finalizar caso
      const result = clinicalCaseManager.completeCase();
      setFinalResult(result);
      setViewMode('result');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCase(null);
    setProgress(null);
    setCurrentDecisionIndex(0);
    setSelectedOption(undefined);
    setShowFeedback(false);
    setFinalResult(null);
    clinicalCaseManager.reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-cyan-400/60 rounded-lg shadow-[0_0_40px_rgba(34,211,238,0.2)] max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b-2 border-cyan-400/50 p-4 flex items-center justify-between z-10">
          <h2 className="text-cyan-300 text-sm flex items-center gap-2">
            <span className="text-lg">📋</span>
            CASOS CLINICOS
          </h2>
          <div className="flex items-center gap-2">
            {viewMode !== 'list' && (
              <button
                onClick={handleBackToList}
                className="text-slate-400 hover:text-white text-[8px] px-2 py-1 border border-slate-600 rounded hover:border-slate-400"
              >
                ← VOLTAR
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-400 text-xs px-2 py-1 border border-slate-600 rounded hover:border-red-400 transition-colors"
            >
              [X]
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Lista de casos */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-[9px] mb-4">
                Selecione um caso clinico para praticar tomada de decisoes em anestesiologia.
              </p>
              <div className="grid gap-4">
                {cases.map(c => (
                  <CaseCard
                    key={c.id}
                    clinicalCase={c}
                    onSelect={() => handleSelectCase(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Detalhes do caso */}
          {viewMode === 'case' && selectedCase && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-amber-300 text-[12px]">{selectedCase.title}</h3>
                <span className="text-slate-500 text-[9px]">ASA {selectedCase.patient.asa}</span>
              </div>

              {/* Info do paciente */}
              <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                <div className="text-[8px] text-cyan-400 mb-2 uppercase">Paciente</div>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div><span className="text-slate-500">Nome:</span> <span className="text-white">{selectedCase.patient.name}</span></div>
                  <div><span className="text-slate-500">Idade:</span> <span className="text-white">{selectedCase.patient.age} anos</span></div>
                  <div><span className="text-slate-500">Peso:</span> <span className="text-white">{selectedCase.patient.weight} kg</span></div>
                  <div><span className="text-slate-500">Altura:</span> <span className="text-white">{selectedCase.patient.height} cm</span></div>
                  <div className="col-span-2"><span className="text-slate-500">Alergias:</span> <span className="text-red-300">{selectedCase.patient.allergies.join(', ') || 'NKDA'}</span></div>
                  <div className="col-span-2"><span className="text-slate-500">Comorbidades:</span> <span className="text-white">{selectedCase.patient.comorbidities.join(', ')}</span></div>
                </div>
              </div>

              {/* Queixa e historia */}
              <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                <div className="text-[8px] text-cyan-400 mb-2 uppercase">Historia</div>
                <div className="text-[9px] space-y-2">
                  <p><span className="text-amber-300">QP:</span> <span className="text-white">{selectedCase.chiefComplaint}</span></p>
                  <p><span className="text-slate-500">HDA:</span> <span className="text-slate-300">{selectedCase.historyOfPresentIllness}</span></p>
                </div>
              </div>

              {/* Vitais e Labs */}
              <div className="grid grid-cols-2 gap-4">
                <VitalsMonitor vitals={selectedCase.initialVitals} />
                {selectedCase.labResults && (
                  <div className="bg-slate-900 border border-purple-400/30 rounded p-3">
                    <div className="text-[8px] text-purple-400 mb-2 uppercase">Labs</div>
                    <div className="grid grid-cols-2 gap-1 text-[8px]">
                      {selectedCase.labResults.hemoglobin && <div>Hb: {selectedCase.labResults.hemoglobin}</div>}
                      {selectedCase.labResults.platelets && <div>Plaq: {selectedCase.labResults.platelets}</div>}
                      {selectedCase.labResults.creatinine && <div>Cr: {selectedCase.labResults.creatinine}</div>}
                      {selectedCase.labResults.potassium && <div>K: {selectedCase.labResults.potassium}</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Objetivos */}
              <div className="bg-slate-800/50 border border-emerald-400/30 rounded p-3">
                <div className="text-[8px] text-emerald-400 mb-2 uppercase">Objetivos de Aprendizado</div>
                <ul className="text-[9px] text-slate-300 space-y-1">
                  {selectedCase.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleStartCase}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] py-3 rounded border border-cyan-400 transition-colors"
              >
                INICIAR CASO
              </button>
            </div>
          )}

          {/* Decisao atual */}
          {viewMode === 'decision' && selectedCase && progress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-slate-400">
                  Decisao {currentDecisionIndex + 1} de {selectedCase.preOpDecisions.length}
                </div>
                <div className="text-[9px] text-amber-300">
                  Score: {progress.score}
                </div>
              </div>

              <VitalsMonitor vitals={progress.currentVitals} />

              <DecisionViewer
                decision={selectedCase.preOpDecisions[currentDecisionIndex]}
                onSelect={handleSelectOption}
                selectedOption={selectedOption}
                showFeedback={showFeedback}
              />

              <div className="flex gap-2">
                {!showFeedback ? (
                  <button
                    onClick={handleConfirmDecision}
                    disabled={!selectedOption}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-[10px] py-2 rounded border border-emerald-400 disabled:border-slate-600 transition-colors"
                  >
                    CONFIRMAR
                  </button>
                ) : (
                  <button
                    onClick={handleNextDecision}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] py-2 rounded border border-cyan-400 transition-colors"
                  >
                    {currentDecisionIndex < selectedCase.preOpDecisions.length - 1 ? 'PROXIMA DECISAO' : 'VER RESULTADO'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resultado final */}
          {viewMode === 'result' && finalResult && selectedCase && (
            <div className="space-y-4 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-amber-300 text-[14px]">Caso Concluido!</h3>
              <p className="text-white text-[11px]">{selectedCase.title}</p>

              <div className="bg-slate-800/50 border border-amber-400/30 rounded-lg p-6 my-6">
                <div className="text-[24px] text-amber-300 mb-2">{finalResult.score}</div>
                <div className="text-[9px] text-slate-400">pontos</div>
                <div className="mt-4 text-[11px]">
                  <span className={finalResult.correctPercentage >= 70 ? 'text-emerald-400' : 'text-red-400'}>
                    {finalResult.correctPercentage.toFixed(0)}% de acertos
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-600 rounded p-3 text-left">
                <div className="text-[8px] text-cyan-400 mb-2 uppercase">Pontos-Chave</div>
                <ul className="text-[9px] text-slate-300 space-y-1">
                  {selectedCase.keyTeachingPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleBackToList}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white text-[10px] py-2 rounded border border-slate-600 transition-colors"
              >
                VOLTAR AOS CASOS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalCaseViewer;
