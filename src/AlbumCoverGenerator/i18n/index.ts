// Album Cover Generator — 8-language i18n.
// Locales: en, zh, es, pt, ru, ja, ko, fr
// Fallback chain: detected locale → en. No external lib.

export type Locale = 'en' | 'zh' | 'es' | 'pt' | 'ru' | 'ja' | 'ko' | 'fr';
const SUPPORTED: Locale[] = ['en', 'zh', 'es', 'pt', 'ru', 'ja', 'ko', 'fr'];

function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('game_locale');
    if (override && SUPPORTED.includes(override as Locale)) return override as Locale;
  }
  const lang = (navigator.language || 'en').toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('ru')) return 'ru';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('fr')) return 'fr';
  return 'en';
}

type Dict = Record<string, string>;

const en: Dict = {
  ticket_label_in: 'pressing ticket',
  ticket_label_done: 'release ticket',
  ticket_label_pressing: 'pressing…',
  ticket_label_wall: 'archive',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: 'press a record',
  input_hint_a: 'side a — three tracks',
  input_hint_b: 'press once. side b is silence.',
  input_w1: 'first track',
  input_w2: 'second track',
  input_w3: 'third track',
  input_press: 'press record',

  loading_status: 'pressing',
  loading_sub: 'a moment',

  result_artist: 'artist',
  result_title: 'title',
  result_genre: 'genre',
  result_runtime: 'runtime',
  result_new: 'press another',
  result_wall: 'archive',
  result_share: 'share',

  wall_heading: 'recent pressings',
  wall_sub: 'the last six to ship',
  wall_empty: 'no records have shipped. press the first.',
  wall_back: 'back',

  err_words: 'fill all three',
  hint_tap_play: 'fill three tracks',

  footer_hero_in: 'order a pressing',
  footer_hero_done: 'limited pressing',
};

const zh: Dict = {
  ticket_label_in: '压片工单',
  ticket_label_done: '发行票',
  ticket_label_pressing: '压片中…',
  ticket_label_wall: '档案',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: '压一张唱片',
  input_hint_a: 'A 面 — 三首',
  input_hint_b: '只压一次  B 面留白',
  input_w1: '第一曲',
  input_w2: '第二曲',
  input_w3: '第三曲',
  input_press: '压成黑胶',

  loading_status: '压片中',
  loading_sub: '请稍候',

  result_artist: '艺人',
  result_title: '专辑',
  result_genre: '风格',
  result_runtime: '总长',
  result_new: '再压一张',
  result_wall: '看档案',
  result_share: '分享',

  wall_heading: '近期出片',
  wall_sub: '最近六张出厂',
  wall_empty: '还没有人下单  由你开始',
  wall_back: '返回',

  err_words: '请填满三首',
  hint_tap_play: '填三首再压',

  footer_hero_in: '下单压片',
  footer_hero_done: '限量压片',
};

const es: Dict = {
  ticket_label_in: 'orden de prensa',
  ticket_label_done: 'ticket de lanzamiento',
  ticket_label_pressing: 'prensando…',
  ticket_label_wall: 'archivo',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: 'prensa un disco',
  input_hint_a: 'lado a — tres pistas',
  input_hint_b: 'una sola prensa.  el lado b queda mudo.',
  input_w1: 'primera pista',
  input_w2: 'segunda pista',
  input_w3: 'tercera pista',
  input_press: 'prensar disco',

  loading_status: 'prensando',
  loading_sub: 'un momento',

  result_artist: 'artista',
  result_title: 'título',
  result_genre: 'género',
  result_runtime: 'duración',
  result_new: 'otro disco',
  result_wall: 'archivo',
  result_share: 'compartir',

  wall_heading: 'prensas recientes',
  wall_sub: 'los últimos seis enviados',
  wall_empty: 'ningún disco salió aún. prensa el primero.',
  wall_back: 'volver',

  err_words: 'rellena las tres',
  hint_tap_play: 'rellena tres pistas',

  footer_hero_in: 'encarga una prensa',
  footer_hero_done: 'prensa limitada',
};

const pt: Dict = {
  ticket_label_in: 'pedido de prensagem',
  ticket_label_done: 'ticket de lançamento',
  ticket_label_pressing: 'prensando…',
  ticket_label_wall: 'arquivo',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: 'prensar um disco',
  input_hint_a: 'lado a — três faixas',
  input_hint_b: 'prensa única.  lado b em silêncio.',
  input_w1: 'primeira faixa',
  input_w2: 'segunda faixa',
  input_w3: 'terceira faixa',
  input_press: 'prensar disco',

  loading_status: 'prensando',
  loading_sub: 'um momento',

  result_artist: 'artista',
  result_title: 'título',
  result_genre: 'gênero',
  result_runtime: 'duração',
  result_new: 'outro disco',
  result_wall: 'arquivo',
  result_share: 'compartilhar',

  wall_heading: 'prensagens recentes',
  wall_sub: 'as últimas seis enviadas',
  wall_empty: 'nenhum disco saiu ainda. prensa o primeiro.',
  wall_back: 'voltar',

  err_words: 'preencha as três',
  hint_tap_play: 'preencha três faixas',

  footer_hero_in: 'encomenda uma prensa',
  footer_hero_done: 'prensa limitada',
};

const ru: Dict = {
  ticket_label_in: 'заказ на пресс',
  ticket_label_done: 'релизный билет',
  ticket_label_pressing: 'пресс…',
  ticket_label_wall: 'архив',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: 'записать пластинку',
  input_hint_a: 'сторона a — три трека',
  input_hint_b: 'один пресс.  сторона b — тишина.',
  input_w1: 'первый трек',
  input_w2: 'второй трек',
  input_w3: 'третий трек',
  input_press: 'запрессовать',

  loading_status: 'пресс',
  loading_sub: 'минутку',

  result_artist: 'артист',
  result_title: 'альбом',
  result_genre: 'жанр',
  result_runtime: 'длительность',
  result_new: 'ещё один',
  result_wall: 'архив',
  result_share: 'поделиться',

  wall_heading: 'недавние прессы',
  wall_sub: 'последние шесть выпусков',
  wall_empty: 'пока ничего не выпущено. начни ты.',
  wall_back: 'назад',

  err_words: 'заполни все три',
  hint_tap_play: 'впиши три трека',

  footer_hero_in: 'заказать пресс',
  footer_hero_done: 'лимитированный пресс',
};

const ja: Dict = {
  ticket_label_in: 'プレス工程票',
  ticket_label_done: 'リリース票',
  ticket_label_pressing: 'プレス中…',
  ticket_label_wall: 'アーカイブ',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: 'レコードを切る',
  input_hint_a: 'A 面 — 3 曲',
  input_hint_b: '一度きり  B 面は無音',
  input_w1: '1 曲目',
  input_w2: '2 曲目',
  input_w3: '3 曲目',
  input_press: 'プレスする',

  loading_status: 'プレス中',
  loading_sub: '少々お待ちを',

  result_artist: 'アーティスト',
  result_title: 'タイトル',
  result_genre: 'ジャンル',
  result_runtime: '総時間',
  result_new: 'もう一枚',
  result_wall: 'アーカイブ',
  result_share: 'シェア',

  wall_heading: '最近のプレス',
  wall_sub: '直近 6 枚の出荷',
  wall_empty: 'まだ一枚も出ていない。最初の一枚を。',
  wall_back: '戻る',

  err_words: '3 つ全部入れて',
  hint_tap_play: '3 曲入れて',

  footer_hero_in: 'プレスを依頼',
  footer_hero_done: '限定プレス',
};

const ko: Dict = {
  ticket_label_in: '프레스 작업표',
  ticket_label_done: '발매 티켓',
  ticket_label_pressing: '프레싱…',
  ticket_label_wall: '아카이브',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: '레코드 만들기',
  input_hint_a: 'A 면 — 3 곡',
  input_hint_b: '한 번만  B 면은 침묵',
  input_w1: '첫 번째 곡',
  input_w2: '두 번째 곡',
  input_w3: '세 번째 곡',
  input_press: '프레스 하기',

  loading_status: '프레스 중',
  loading_sub: '잠시만요',

  result_artist: '아티스트',
  result_title: '타이틀',
  result_genre: '장르',
  result_runtime: '총 길이',
  result_new: '한 장 더',
  result_wall: '아카이브',
  result_share: '공유',

  wall_heading: '최근 프레스',
  wall_sub: '최근 출고된 6 장',
  wall_empty: '아직 출고된 게 없어. 첫 장을 찍어봐.',
  wall_back: '뒤로',

  err_words: '세 칸 모두 채워줘',
  hint_tap_play: '세 곡을 채워줘',

  footer_hero_in: '프레스 주문',
  footer_hero_done: '한정 프레스',
};

const fr: Dict = {
  ticket_label_in: 'bon de pressage',
  ticket_label_done: 'ticket de sortie',
  ticket_label_pressing: 'pressage…',
  ticket_label_wall: 'archives',
  brand: 'ALTERU RECORDS',
  brand_mark: 'ALT24',

  input_heading: 'presser un disque',
  input_hint_a: 'face a — trois titres',
  input_hint_b: 'un seul pressage.  face b muette.',
  input_w1: 'premier titre',
  input_w2: 'deuxième titre',
  input_w3: 'troisième titre',
  input_press: 'presser',

  loading_status: 'pressage',
  loading_sub: 'un instant',

  result_artist: 'artiste',
  result_title: 'titre',
  result_genre: 'genre',
  result_runtime: 'durée',
  result_new: 'encore un',
  result_wall: 'archives',
  result_share: 'partager',

  wall_heading: 'pressages récents',
  wall_sub: 'les six derniers sortis',
  wall_empty: 'aucun disque sorti. presse le premier.',
  wall_back: 'retour',

  err_words: 'remplis les trois',
  hint_tap_play: 'remplis trois titres',

  footer_hero_in: 'commander un pressage',
  footer_hero_done: 'pressage limité',
};

const DICTS: Record<Locale, Dict> = { en, zh, es, pt, ru, ja, ko, fr };

const _locale: Locale = detectLocale();
const _dict: Dict = DICTS[_locale];
const _fallback: Dict = en;

export function t(key: string): string {
  return _dict[key] ?? _fallback[key] ?? key;
}

export function locale(): Locale {
  return _locale;
}
