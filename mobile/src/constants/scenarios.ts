export type ScenarioId = 'cafe' | 'hotel' | 'hospital' | 'interview' | 'shopping';

export type Scenario = {
  id: ScenarioId;
  title: string;
  emoji: string;
  subtitle: string;
};

export const SCENARIOS: Scenario[] = [
  { id: 'cafe', title: 'Kafe', emoji: '☕', subtitle: 'Sipariş, tavsiye, sohbet' },
  { id: 'hotel', title: 'Otel', emoji: '🏨', subtitle: 'Check-in, oda, yön' },
  { id: 'hospital', title: 'Hastane', emoji: '🏥', subtitle: 'Randevu, şikâyet' },
  { id: 'interview', title: 'İş görüşmesi', emoji: '💼', subtitle: 'Tanışma, deneyim' },
  { id: 'shopping', title: 'Alışveriş', emoji: '🛒', subtitle: 'Fiyat, indirim, ürün' },
];

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_OPTIONS: { id: Difficulty; label: string }[] = [
  { id: 'beginner', label: 'Başlangıç' },
  { id: 'intermediate', label: 'Orta' },
  { id: 'advanced', label: 'İleri' },
];
