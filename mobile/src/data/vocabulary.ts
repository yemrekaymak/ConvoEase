import type { DifficultyLevel, VocabularyItem } from '../types/miniGames';

type VocabularySeed = {
  promptKey: string;
  difficultyLevel: DifficultyLevel;
  items: Omit<VocabularyItem, 'id' | 'promptKey' | 'difficultyLevel'>[];
};

const seeds: VocabularySeed[] = [
  {
    promptKey: 'kafe',
    difficultyLevel: 1,
    items: [
      { word: 'coffee', translation: 'kahve', partOfSpeech: 'noun', exampleSentence: 'I want coffee.', exampleTranslation: 'Kahve istiyorum.' },
      { word: 'tea', translation: 'cay', partOfSpeech: 'noun', exampleSentence: 'I would like tea.', exampleTranslation: 'Cay isterim.' },
      { word: 'menu', translation: 'menu', partOfSpeech: 'noun', exampleSentence: 'Can I see the menu?', exampleTranslation: 'Menuyu gorebilir miyim?' },
      { word: 'table', translation: 'masa', partOfSpeech: 'noun', exampleSentence: 'Is this table free?', exampleTranslation: 'Bu masa bos mu?' },
      { word: 'bill', translation: 'hesap', partOfSpeech: 'noun', exampleSentence: 'Can I have the bill?', exampleTranslation: 'Hesabi alabilir miyim?' },
      { word: 'waiter', translation: 'garson', partOfSpeech: 'noun', exampleSentence: 'The waiter is very friendly.', exampleTranslation: 'Garson cok cana yakin.' },
      { word: 'order', translation: 'siparis', partOfSpeech: 'verb', exampleSentence: 'I want to order a coffee.', exampleTranslation: 'Bir kahve siparis etmek istiyorum.' },
      { word: 'sugar', translation: 'seker', partOfSpeech: 'noun', exampleSentence: 'I do not want sugar.', exampleTranslation: 'Seker istemiyorum.' },
      { word: 'milk', translation: 'sut', partOfSpeech: 'noun', exampleSentence: 'Can I have some milk?', exampleTranslation: 'Biraz sut alabilir miyim?' },
      { word: 'cup', translation: 'fincan', partOfSpeech: 'noun', exampleSentence: 'A cup of tea would be great.', exampleTranslation: 'Bir fincan cay harika olur.' },
    ],
  },
  {
    promptKey: 'otel',
    difficultyLevel: 1,
    items: [
      { word: 'room', translation: 'oda', partOfSpeech: 'noun', exampleSentence: 'I need a room.', exampleTranslation: 'Bir odaya ihtiyacim var.' },
      { word: 'reservation', translation: 'rezervasyon', partOfSpeech: 'noun', exampleSentence: 'My reservation is ready.', exampleTranslation: 'Rezervasyonum hazir.' },
      { word: 'key', translation: 'anahtar', partOfSpeech: 'noun', exampleSentence: 'I need my room key.', exampleTranslation: 'Oda anahtarima ihtiyacim var.' },
      { word: 'reception', translation: 'resepsiyon', partOfSpeech: 'noun', exampleSentence: 'The reception is downstairs.', exampleTranslation: 'Resepsiyon alt katta.' },
      { word: 'guest', translation: 'misafir', partOfSpeech: 'noun', exampleSentence: 'The guest is waiting.', exampleTranslation: 'Misafir bekliyor.' },
      { word: 'check-in', translation: 'giris islemi', partOfSpeech: 'noun', exampleSentence: 'I would like to check in.', exampleTranslation: 'Giris yapmak istiyorum.' },
      { word: 'check-out', translation: 'cikis islemi', partOfSpeech: 'noun', exampleSentence: 'What time is check out?', exampleTranslation: 'Cikis saati kacta?' },
      { word: 'elevator', translation: 'asansor', partOfSpeech: 'noun', exampleSentence: 'The elevator is on the right.', exampleTranslation: 'Asansor sag tarafta.' },
      { word: 'breakfast', translation: 'kahvalti', partOfSpeech: 'noun', exampleSentence: 'Is breakfast included?', exampleTranslation: 'Kahvalti dahil mi?' },
      { word: 'floor', translation: 'kat', partOfSpeech: 'noun', exampleSentence: 'My room is on the third floor.', exampleTranslation: 'Odam ucuncu katta.' },
    ],
  },
  {
    promptKey: 'hastane',
    difficultyLevel: 1,
    items: [
      { word: 'doctor', translation: 'doktor', partOfSpeech: 'noun', exampleSentence: 'I need a doctor.', exampleTranslation: 'Doktora ihtiyacim var.' },
      { word: 'nurse', translation: 'hemsire', partOfSpeech: 'noun', exampleSentence: 'The nurse will help you.', exampleTranslation: 'Hemsire size yardim edecek.' },
      { word: 'pain', translation: 'agri', partOfSpeech: 'noun', exampleSentence: 'I have pain in my arm.', exampleTranslation: 'Kolumda agri var.' },
      { word: 'medicine', translation: 'ilac', partOfSpeech: 'noun', exampleSentence: 'I need this medicine.', exampleTranslation: 'Bu ilaca ihtiyacim var.' },
      { word: 'patient', translation: 'hasta', partOfSpeech: 'noun', exampleSentence: 'The patient is waiting outside.', exampleTranslation: 'Hasta disarida bekliyor.' },
      { word: 'appointment', translation: 'randevu', partOfSpeech: 'noun', exampleSentence: 'I have an appointment today.', exampleTranslation: 'Bugun bir randevum var.' },
      { word: 'emergency', translation: 'acil durum', partOfSpeech: 'noun', exampleSentence: 'This is an emergency.', exampleTranslation: 'Bu bir acil durum.' },
      { word: 'fever', translation: 'ates', partOfSpeech: 'noun', exampleSentence: 'I have a fever.', exampleTranslation: 'Atesim var.' },
      { word: 'headache', translation: 'bas agrisi', partOfSpeech: 'noun', exampleSentence: 'I have a headache.', exampleTranslation: 'Basim agriyor.' },
      { word: 'treatment', translation: 'tedavi', partOfSpeech: 'noun', exampleSentence: 'The treatment starts tomorrow.', exampleTranslation: 'Tedavi yarin basliyor.' },
    ],
  },
  {
    promptKey: 'alisveris',
    difficultyLevel: 1,
    items: [
      { word: 'price', translation: 'fiyat', partOfSpeech: 'noun', exampleSentence: 'What is the price?', exampleTranslation: 'Fiyat nedir?' },
      { word: 'discount', translation: 'indirim', partOfSpeech: 'noun', exampleSentence: 'Is there a discount?', exampleTranslation: 'Indirim var mi?' },
      { word: 'shirt', translation: 'gomlek', partOfSpeech: 'noun', exampleSentence: 'This shirt is nice.', exampleTranslation: 'Bu gomlek guzel.' },
      { word: 'shoes', translation: 'ayakkabi', partOfSpeech: 'noun', exampleSentence: 'I want to buy shoes.', exampleTranslation: 'Ayakkabi satin almak istiyorum.' },
      { word: 'size', translation: 'beden', partOfSpeech: 'noun', exampleSentence: 'Do you have my size?', exampleTranslation: 'Benim bedenim var mi?' },
      { word: 'bag', translation: 'canta', partOfSpeech: 'noun', exampleSentence: 'I need a bag.', exampleTranslation: 'Bir cantaya ihtiyacim var.' },
      { word: 'cashier', translation: 'kasiyer', partOfSpeech: 'noun', exampleSentence: 'The cashier is over there.', exampleTranslation: 'Kasiyer surada.' },
      { word: 'receipt', translation: 'fis', partOfSpeech: 'noun', exampleSentence: 'Can I have the receipt?', exampleTranslation: 'Fisi alabilir miyim?' },
      { word: 'expensive', translation: 'pahali', partOfSpeech: 'adjective', exampleSentence: 'This is too expensive.', exampleTranslation: 'Bu cok pahali.' },
      { word: 'cheap', translation: 'ucuz', partOfSpeech: 'adjective', exampleSentence: 'This one is cheap.', exampleTranslation: 'Bu daha ucuz.' },
    ],
  },
  {
    promptKey: 'is_gorusmesi',
    difficultyLevel: 1,
    items: [
      { word: 'interview', translation: 'mulakat', partOfSpeech: 'noun', exampleSentence: 'I have an interview today.', exampleTranslation: 'Bugun bir mulakatim var.' },
      { word: 'experience', translation: 'deneyim', partOfSpeech: 'noun', exampleSentence: 'I have experience in sales.', exampleTranslation: 'Satis alaninda deneyimim var.' },
      { word: 'salary', translation: 'maas', partOfSpeech: 'noun', exampleSentence: 'What is the salary range?', exampleTranslation: 'Maas araligi nedir?' },
      { word: 'manager', translation: 'yonetici', partOfSpeech: 'noun', exampleSentence: 'The manager will meet you soon.', exampleTranslation: 'Yonetici sizinle birazdan gorusecek.' },
      { word: 'company', translation: 'sirket', partOfSpeech: 'noun', exampleSentence: 'I like this company.', exampleTranslation: 'Bu sirketi seviyorum.' },
      { word: 'resume', translation: 'ozgecmis', partOfSpeech: 'noun', exampleSentence: 'Here is my resume.', exampleTranslation: 'Iste ozgecmisim.' },
      { word: 'skill', translation: 'beceri', partOfSpeech: 'noun', exampleSentence: 'Communication is my best skill.', exampleTranslation: 'Iletisim en iyi becerimdir.' },
      { word: 'office', translation: 'ofis', partOfSpeech: 'noun', exampleSentence: 'The office is in the city center.', exampleTranslation: 'Ofis sehir merkezinde.' },
      { word: 'employee', translation: 'calisan', partOfSpeech: 'noun', exampleSentence: 'Every employee has training.', exampleTranslation: 'Her calisanin egitimi var.' },
      { word: 'meeting', translation: 'toplanti', partOfSpeech: 'noun', exampleSentence: 'We have a meeting every Monday.', exampleTranslation: 'Her pazartesi bir toplantimiz var.' },
    ],
  },
  {
    promptKey: 'kafe',
    difficultyLevel: 2,
    items: [
      { word: 'recommend', translation: 'onermek', partOfSpeech: 'verb', exampleSentence: 'What would you recommend?', exampleTranslation: 'Ne onerirsiniz?' },
      { word: 'ingredient', translation: 'malzeme', partOfSpeech: 'noun', exampleSentence: 'What ingredients are in this cake?', exampleTranslation: 'Bu kekte hangi malzemeler var?' },
      { word: 'reservation', translation: 'rezervasyon', partOfSpeech: 'noun', exampleSentence: 'I made a reservation for two.', exampleTranslation: 'Iki kisilik rezervasyon yaptim.' },
      { word: 'available', translation: 'musait', partOfSpeech: 'adjective', exampleSentence: 'Is this seat available?', exampleTranslation: 'Bu yer musait mi?' },
      { word: 'window', translation: 'pencere', partOfSpeech: 'noun', exampleSentence: 'I want a table by the window.', exampleTranslation: 'Pencere kenarinda bir masa istiyorum.' },
      { word: 'dessert', translation: 'tatli', partOfSpeech: 'noun', exampleSentence: 'Which dessert is popular?', exampleTranslation: 'Hangi tatli populer?' },
    ],
  },
  {
    promptKey: 'otel',
    difficultyLevel: 2,
    items: [
      { word: 'upgrade', translation: 'yukseltme', partOfSpeech: 'noun', exampleSentence: 'Is an upgrade possible?', exampleTranslation: 'Yukseltme mumkun mu?' },
      { word: 'receipt', translation: 'makbuz', partOfSpeech: 'noun', exampleSentence: 'Could I get a receipt?', exampleTranslation: 'Bir makbuz alabilir miyim?' },
      { word: 'available', translation: 'musait', partOfSpeech: 'adjective', exampleSentence: 'Do you have any rooms available?', exampleTranslation: 'Musait odaniz var mi?' },
      { word: 'view', translation: 'manzara', partOfSpeech: 'noun', exampleSentence: 'I want a room with a sea view.', exampleTranslation: 'Deniz manzarali bir oda istiyorum.' },
      { word: 'luggage', translation: 'bagaj', partOfSpeech: 'noun', exampleSentence: 'Could someone help me with my luggage?', exampleTranslation: 'Bana bagajimda yardimci olabilir misiniz?' },
      { word: 'quiet', translation: 'sessiz', partOfSpeech: 'adjective', exampleSentence: 'I need a quiet room.', exampleTranslation: 'Sessiz bir odaya ihtiyacim var.' },
    ],
  },
];

export const VOCABULARY_ITEMS: VocabularyItem[] = seeds.flatMap((seed) =>
  seed.items.map((item, index) => ({
    id: `${seed.promptKey}-${seed.difficultyLevel}-vocab-${index + 1}`,
    promptKey: seed.promptKey,
    difficultyLevel: seed.difficultyLevel,
    ...item,
  }))
);

export function getVocabularyForScenario(promptKey: string, difficultyLevel: DifficultyLevel) {
  return VOCABULARY_ITEMS.filter(
    (item) => item.promptKey === promptKey && item.difficultyLevel === difficultyLevel
  );
}

export function findVocabularyMeaning(promptKey: string, token: string, difficultyLevel?: DifficultyLevel) {
  const normalized = token.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');
  return VOCABULARY_ITEMS.find((item) => {
    if (item.promptKey !== promptKey) return false;
    if (difficultyLevel && item.difficultyLevel !== difficultyLevel) return false;
    return item.word.toLowerCase() === normalized;
  });
}
