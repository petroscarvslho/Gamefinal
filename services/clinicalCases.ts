/**
 * Sistema de Casos Clinicos - MediQuest/GRANADO
 * Gerencia cenarios clinicos educacionais para anestesiologia
 */

export type Specialty =
  | 'general' | 'cardiac' | 'orthopedic' | 'neurosurgery'
  | 'urology' | 'obstetric' | 'pediatric' | 'vascular'
  | 'thoracic' | 'ophthalmology' | 'otorhinolaryngology';

export type ASAClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export type AirwayClass = 'I' | 'II' | 'III' | 'IV'; // Mallampati

export interface VitalSigns {
  heartRate: number;      // bpm
  bloodPressure: { systolic: number; diastolic: number };
  spO2: number;           // %
  temperature: number;    // Celsius
  respiratoryRate: number; // rpm
  painScore?: number;     // 0-10
}

export interface LabResults {
  hemoglobin?: number;    // g/dL
  hematocrit?: number;    // %
  platelets?: number;     // x1000/uL
  inr?: number;
  ptt?: number;
  creatinine?: number;    // mg/dL
  potassium?: number;     // mEq/L
  sodium?: number;        // mEq/L
  glucose?: number;       // mg/dL
  troponin?: number;
}

export interface PatientInfo {
  name: string;
  age: number;
  weight: number;         // kg
  height: number;         // cm
  gender: 'M' | 'F';
  asa: ASAClass;
  allergies: string[];
  comorbidities: string[];
  medications: string[];
  fastingTime: number;    // horas
  airwayMallampati: AirwayClass;
  airwayNotes?: string;
}

export interface ClinicalExam {
  type: 'ECG' | 'ECHO' | 'XRAY' | 'CT' | 'MRI' | 'LAB' | 'SPIROMETRY';
  name: string;
  result: string;
  isAbnormal: boolean;
  imageUrl?: string;
}

export interface DecisionPoint {
  id: string;
  question: string;
  context: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
    consequence?: string; // O que acontece apos essa escolha
  }[];
  hints?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ClinicalEvent {
  id: string;
  time: number;           // minutos desde inicio
  type: 'INDUCTION' | 'MAINTENANCE' | 'EMERGENCE' | 'COMPLICATION' | 'ROUTINE';
  description: string;
  vitalChanges?: Partial<VitalSigns>;
  decision?: DecisionPoint;
  autoResolve?: boolean;
}

export interface ClinicalCase {
  id: string;
  title: string;
  specialty: Specialty;
  procedure: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number; // minutos
  learningObjectives: string[];

  // Paciente
  patient: PatientInfo;
  initialVitals: VitalSigns;
  labResults?: LabResults;
  exams: ClinicalExam[];

  // Historia
  chiefComplaint: string;
  historyOfPresentIllness: string;
  surgicalHistory?: string;
  anesthesiaHistory?: string;

  // Fluxo do caso
  preOpDecisions: DecisionPoint[];
  intraOpEvents: ClinicalEvent[];
  postOpDecisions?: DecisionPoint[];

  // Desfecho
  expectedDuration: number; // minutos
  possibleComplications: string[];
  keyTeachingPoints: string[];
  references?: string[];
}

export interface CaseProgress {
  caseId: string;
  startedAt: Date;
  currentPhase: 'preop' | 'induction' | 'maintenance' | 'emergence' | 'postop' | 'completed';
  decisionsHistory: {
    decisionId: string;
    selectedOption: string;
    wasCorrect: boolean;
    timestamp: Date;
  }[];
  score: number;
  currentVitals: VitalSigns;
  elapsedTime: number; // minutos
}

// === CASOS CLINICOS PRE-DEFINIDOS ===

export const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 'case_001_colecistectomia',
    title: 'Colecistectomia Laparoscopica',
    specialty: 'general',
    procedure: 'Colecistectomia videolaparoscopica',
    difficulty: 'beginner',
    estimatedDuration: 90,
    learningObjectives: [
      'Avaliar paciente ASA II para cirurgia eletiva',
      'Planejar anestesia geral para laparoscopia',
      'Manejar pneumoperitonio',
      'Prevenir NVPO',
    ],
    patient: {
      name: 'Maria Santos',
      age: 45,
      weight: 72,
      height: 162,
      gender: 'F',
      asa: 'II',
      allergies: ['Dipirona'],
      comorbidities: ['Hipertensao controlada', 'Obesidade grau I'],
      medications: ['Losartana 50mg/dia', 'AAS 100mg/dia'],
      fastingTime: 8,
      airwayMallampati: 'II',
    },
    initialVitals: {
      heartRate: 78,
      bloodPressure: { systolic: 142, diastolic: 88 },
      spO2: 97,
      temperature: 36.5,
      respiratoryRate: 16,
    },
    labResults: {
      hemoglobin: 13.2,
      hematocrit: 39,
      platelets: 245,
      inr: 1.1,
      creatinine: 0.9,
      potassium: 4.2,
      sodium: 140,
      glucose: 98,
    },
    exams: [
      {
        type: 'ECG',
        name: 'ECG 12 derivacoes',
        result: 'Ritmo sinusal, FC 75bpm, sem alteracoes isquemicas',
        isAbnormal: false,
      },
      {
        type: 'XRAY',
        name: 'RX Torax PA',
        result: 'Campos pulmonares livres, area cardiaca normal',
        isAbnormal: false,
      },
    ],
    chiefComplaint: 'Dor em hipocondrio direito ha 3 meses, pior apos alimentacao gordurosa',
    historyOfPresentIllness: 'Paciente relata colicas biliares recorrentes, USG mostrou colelitíase múltipla',
    surgicalHistory: 'Cesarea ha 15 anos, sem intercorrencias',
    anesthesiaHistory: 'Anestesia raqui para cesarea, sem problemas',
    preOpDecisions: [
      {
        id: 'decision_asa_001',
        question: 'Como você suspenderia o AAS nesta paciente?',
        context: 'Paciente em uso de AAS 100mg/dia para prevenção cardiovascular primária.',
        options: [
          {
            id: 'suspend_7days',
            text: 'Suspender 7 dias antes',
            isCorrect: true,
            feedback: 'Correto! Para cirurgias eletivas de baixo risco de sangramento, suspender AAS 7 dias permite recuperação plaquetária adequada.',
          },
          {
            id: 'suspend_3days',
            text: 'Suspender 3 dias antes',
            isCorrect: false,
            feedback: 'Incorreto. 3 dias é insuficiente para recuperação completa da função plaquetária.',
          },
          {
            id: 'no_suspend',
            text: 'Manter o AAS',
            isCorrect: false,
            feedback: 'Incorreto. Para colecistectomia eletiva, é recomendado suspender AAS pelo risco de sangramento.',
          },
          {
            id: 'suspend_24h',
            text: 'Suspender 24h antes',
            isCorrect: false,
            feedback: 'Incorreto. O efeito do AAS nas plaquetas dura toda a vida da plaqueta (7-10 dias).',
          },
        ],
        difficulty: 'easy',
      },
      {
        id: 'decision_induction_001',
        question: 'Qual tecnica de inducao você escolheria?',
        context: 'Paciente jejum de 8h, sem preditores de via aerea dificil, IMC 27.',
        options: [
          {
            id: 'standard_iv',
            text: 'Inducao IV padrao (Propofol + Fentanil + Rocuronio)',
            isCorrect: true,
            feedback: 'Correto! Para paciente sem risco de broncoaspiracao, inducao IV padrao e adequada.',
          },
          {
            id: 'rsi',
            text: 'Sequencia rapida de intubacao',
            isCorrect: false,
            feedback: 'Nao indicado. Paciente em jejum adequado, sem fatores de risco para broncoaspiracao.',
          },
          {
            id: 'inhalatory',
            text: 'Inducao inalatoria com sevoflurano',
            isCorrect: false,
            feedback: 'Pouco pratico em adultos. Reservada para situacoes especiais ou pediatria.',
          },
          {
            id: 'awake',
            text: 'Intubacao acordado',
            isCorrect: false,
            feedback: 'Nao indicado. Sem preditores de via aerea dificil. Causaria desconforto desnecessario.',
          },
        ],
        difficulty: 'easy',
      },
    ],
    intraOpEvents: [
      {
        id: 'event_pneumo_001',
        time: 15,
        type: 'ROUTINE',
        description: 'Inicio do pneumoperitonio. Pressao intra-abdominal 12mmHg.',
        vitalChanges: {
          bloodPressure: { systolic: 155, diastolic: 92 },
          heartRate: 85,
        },
      },
      {
        id: 'event_trendelenburg_001',
        time: 20,
        type: 'ROUTINE',
        description: 'Posicionamento em Trendelenburg reverso.',
        vitalChanges: {
          bloodPressure: { systolic: 135, diastolic: 82 },
        },
      },
      {
        id: 'event_bradycardia_001',
        time: 35,
        type: 'COMPLICATION',
        description: 'Tracao do peritonio causa bradicardia reflexa.',
        vitalChanges: {
          heartRate: 48,
        },
        decision: {
          id: 'decision_brady_001',
          question: 'FC caiu para 48bpm durante tracao peritoneal. Conduta?',
          context: 'Reflexo vagal por tracao do peritonio. PA estavel em 125x78.',
          options: [
            {
              id: 'atropine',
              text: 'Atropina 0.5mg IV',
              isCorrect: true,
              feedback: 'Correto! Atropina e primeira escolha para bradicardia reflexa vagal.',
            },
            {
              id: 'stop_surgery',
              text: 'Solicitar pausa na cirurgia',
              isCorrect: false,
              feedback: 'Parcialmente correto, mas atropina resolve rapidamente sem necessidade de pausa.',
            },
            {
              id: 'adrenaline',
              text: 'Adrenalina 10mcg IV',
              isCorrect: false,
              feedback: 'Desproporcional. Adrenalina reservada para bradicardia sintomatica grave.',
            },
            {
              id: 'observe',
              text: 'Apenas observar',
              isCorrect: false,
              feedback: 'Incorreto. FC <50 requer tratamento, mesmo com PA estavel.',
            },
          ],
          difficulty: 'medium',
        },
      },
    ],
    expectedDuration: 75,
    possibleComplications: [
      'Bradicardia reflexa',
      'Hipercapnia por pneumoperitonio',
      'Lesao de via biliar',
      'NVPO pos-operatorio',
    ],
    keyTeachingPoints: [
      'Suspensao de antiagregantes em cirurgia eletiva',
      'Fisiologia do pneumoperitonio',
      'Manejo de reflexos vagais intraoperatorios',
      'Profilaxia de NVPO em laparoscopia',
    ],
  },
  {
    id: 'case_002_revascularizacao',
    title: 'Revascularizacao Miocardica',
    specialty: 'cardiac',
    procedure: 'Cirurgia de revascularizacao miocardica com CEC',
    difficulty: 'advanced',
    estimatedDuration: 240,
    learningObjectives: [
      'Avaliar paciente cardiopata para cirurgia cardiaca',
      'Entender monitorizacao invasiva',
      'Manejar circulacao extracorporea',
      'Conduzir saida de CEC',
    ],
    patient: {
      name: 'Jose Oliveira',
      age: 62,
      weight: 85,
      height: 175,
      gender: 'M',
      asa: 'III',
      allergies: [],
      comorbidities: [
        'DAC triarterial',
        'Diabetes tipo 2',
        'Hipertensao',
        'Dislipidemia',
        'Ex-tabagista',
      ],
      medications: [
        'Metformina 850mg 2x/dia',
        'Atenolol 50mg/dia',
        'Enalapril 10mg 2x/dia',
        'AAS 100mg/dia',
        'Sinvastatina 40mg/noite',
      ],
      fastingTime: 8,
      airwayMallampati: 'II',
      airwayNotes: 'Abertura bucal >3cm, Cormack previsto I-II',
    },
    initialVitals: {
      heartRate: 62,
      bloodPressure: { systolic: 138, diastolic: 82 },
      spO2: 96,
      temperature: 36.4,
      respiratoryRate: 14,
    },
    labResults: {
      hemoglobin: 14.1,
      hematocrit: 42,
      platelets: 198,
      inr: 1.0,
      creatinine: 1.2,
      potassium: 4.5,
      sodium: 138,
      glucose: 142,
      troponin: 0.01,
    },
    exams: [
      {
        type: 'ECG',
        name: 'ECG 12 derivacoes',
        result: 'Ritmo sinusal, infra ST V4-V6, onda Q em parede inferior',
        isAbnormal: true,
      },
      {
        type: 'ECHO',
        name: 'Ecocardiograma',
        result: 'FE 45%, hipocinesia de parede inferior e lateral, VE levemente dilatado',
        isAbnormal: true,
      },
      {
        type: 'CT',
        name: 'Cineangiocoronariografia',
        result: 'Lesao 90% DA, 80% Cx, 70% CD. Indicacao cirurgica.',
        isAbnormal: true,
      },
    ],
    chiefComplaint: 'Angina aos medios esforcos, classe funcional III',
    historyOfPresentIllness: 'Paciente com angina progressiva nos ultimos 6 meses, CATE mostrou DAC triarterial com indicacao cirurgica.',
    surgicalHistory: 'Apendicectomia aos 25 anos',
    anesthesiaHistory: 'Anestesia geral para apendicectomia, sem intercorrencias relatadas',
    preOpDecisions: [
      {
        id: 'decision_monitoring_002',
        question: 'Qual monitorizacao invasiva voce instalaria?',
        context: 'Paciente cardiopata grave para cirurgia de RM com CEC.',
        options: [
          {
            id: 'pai_cvc_swan',
            text: 'PAI + CVC + Cateter de Swan-Ganz',
            isCorrect: true,
            feedback: 'Correto! Monitorizacao completa para cirurgia cardiaca com CEC.',
          },
          {
            id: 'pai_cvc',
            text: 'PAI + CVC apenas',
            isCorrect: false,
            feedback: 'Insuficiente. Swan-Ganz permite avaliar debito cardiaco e pressoes de enchimento.',
          },
          {
            id: 'nibp_only',
            text: 'PA nao-invasiva e apenas',
            isCorrect: false,
            feedback: 'Totalmente inadequado para cirurgia cardiaca.',
          },
          {
            id: 'pai_only',
            text: 'Apenas PAI',
            isCorrect: false,
            feedback: 'Insuficiente. Acesso central necessario para drogas vasoativas.',
          },
        ],
        difficulty: 'medium',
      },
    ],
    intraOpEvents: [
      {
        id: 'event_cec_on_002',
        time: 60,
        type: 'ROUTINE',
        description: 'Entrada em CEC. Hipotermia moderada (32C) iniciada.',
        vitalChanges: {
          heartRate: 0, // Coração parado
          bloodPressure: { systolic: 65, diastolic: 65 }, // PAM pela CEC
          temperature: 32,
        },
      },
      {
        id: 'event_cec_off_002',
        time: 150,
        type: 'COMPLICATION',
        description: 'Tentativa de saida de CEC. Coracao nao ejeta adequadamente.',
        decision: {
          id: 'decision_cec_off_002',
          question: 'Dificuldade de saida de CEC. PAM 45mmHg mesmo com drogas. Conduta?',
          context: 'Reaquecimento completo, K+ 4.8, ritmo sinusal mas contracao fraca.',
          options: [
            {
              id: 'iabp',
              text: 'Solicitar balao intra-aortico (BIA)',
              isCorrect: true,
              feedback: 'Correto! BIA e indicado para falencia de saida de CEC.',
            },
            {
              id: 'more_inotropes',
              text: 'Aumentar dose de inotrópicos apenas',
              isCorrect: false,
              feedback: 'Insuficiente se já em doses altas. BIA oferece suporte mecanico.',
            },
            {
              id: 'return_cec',
              text: 'Retornar para CEC e esperar',
              isCorrect: false,
              feedback: 'Parcialmente correto, mas BIA permitira saida mais segura.',
            },
            {
              id: 'volume',
              text: 'Administrar mais volume',
              isCorrect: false,
              feedback: 'Incorreto. Volume em excesso piora funcao ventricular já comprometida.',
            },
          ],
          difficulty: 'hard',
        },
      },
    ],
    expectedDuration: 240,
    possibleComplications: [
      'Dificuldade de saida de CEC',
      'Sangramento pos-CEC',
      'Arritmias',
      'Disfuncao renal',
      'AVC',
    ],
    keyTeachingPoints: [
      'Monitorizacao em cirurgia cardiaca',
      'Fisiologia da CEC',
      'Manejo de saida de CEC',
      'Indicacoes de suporte mecanico',
    ],
  },
];

// === GERENCIADOR DE CASOS ===

class ClinicalCaseManager {
  private cases: Map<string, ClinicalCase> = new Map();
  private activeCase: CaseProgress | null = null;

  constructor() {
    // Registrar casos padrao
    CLINICAL_CASES.forEach(c => this.cases.set(c.id, c));
  }

  // Obter todos os casos disponiveis
  getAllCases(): ClinicalCase[] {
    return Array.from(this.cases.values());
  }

  // Obter casos por especialidade
  getCasesBySpecialty(specialty: Specialty): ClinicalCase[] {
    return this.getAllCases().filter(c => c.specialty === specialty);
  }

  // Obter casos por dificuldade
  getCasesByDifficulty(difficulty: ClinicalCase['difficulty']): ClinicalCase[] {
    return this.getAllCases().filter(c => c.difficulty === difficulty);
  }

  // Obter um caso especifico
  getCase(caseId: string): ClinicalCase | undefined {
    return this.cases.get(caseId);
  }

  // Iniciar um caso
  startCase(caseId: string): CaseProgress | null {
    const clinicalCase = this.cases.get(caseId);
    if (!clinicalCase) return null;

    this.activeCase = {
      caseId,
      startedAt: new Date(),
      currentPhase: 'preop',
      decisionsHistory: [],
      score: 0,
      currentVitals: { ...clinicalCase.initialVitals },
      elapsedTime: 0,
    };

    return this.activeCase;
  }

  // Registrar uma decisao
  recordDecision(decisionId: string, selectedOptionId: string): boolean {
    if (!this.activeCase) return false;

    const clinicalCase = this.cases.get(this.activeCase.caseId);
    if (!clinicalCase) return false;

    // Encontrar a decisao
    let decision: DecisionPoint | undefined;

    // Procurar em preOpDecisions
    decision = clinicalCase.preOpDecisions.find(d => d.id === decisionId);

    // Procurar em eventos intraOp
    if (!decision) {
      for (const event of clinicalCase.intraOpEvents) {
        if (event.decision?.id === decisionId) {
          decision = event.decision;
          break;
        }
      }
    }

    if (!decision) return false;

    const selectedOption = decision.options.find(o => o.id === selectedOptionId);
    if (!selectedOption) return false;

    // Registrar
    this.activeCase.decisionsHistory.push({
      decisionId,
      selectedOption: selectedOptionId,
      wasCorrect: selectedOption.isCorrect,
      timestamp: new Date(),
    });

    // Atualizar score
    if (selectedOption.isCorrect) {
      const difficultyPoints = {
        easy: 10,
        medium: 20,
        hard: 30,
      };
      this.activeCase.score += difficultyPoints[decision.difficulty];
    }

    return selectedOption.isCorrect;
  }

  // Avancar fase
  advancePhase(): void {
    if (!this.activeCase) return;

    const phases: CaseProgress['currentPhase'][] = [
      'preop', 'induction', 'maintenance', 'emergence', 'postop', 'completed'
    ];
    const currentIndex = phases.indexOf(this.activeCase.currentPhase);
    if (currentIndex < phases.length - 1) {
      this.activeCase.currentPhase = phases[currentIndex + 1];
    }
  }

  // Obter progresso atual
  getActiveProgress(): CaseProgress | null {
    return this.activeCase;
  }

  // Finalizar caso
  completeCase(): { score: number; correctPercentage: number } | null {
    if (!this.activeCase) return null;

    const total = this.activeCase.decisionsHistory.length;
    const correct = this.activeCase.decisionsHistory.filter(d => d.wasCorrect).length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;

    this.activeCase.currentPhase = 'completed';

    return {
      score: this.activeCase.score,
      correctPercentage: percentage,
    };
  }

  // Resetar
  reset(): void {
    this.activeCase = null;
  }
}

// Singleton
export const clinicalCaseManager = new ClinicalCaseManager();
export default clinicalCaseManager;
