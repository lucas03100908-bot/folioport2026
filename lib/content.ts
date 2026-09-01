/**
 * lib/content.ts — project data.
 *
 * Copy transcribed from Port_Ho_2026.pdf — 역할 / 도구 / 유형 / 요약 map to
 * `role` / `tools` / `type` / `blurb`, and the page's body paragraphs to
 * `summary`. The only stubs left are `projectUrl` (search `TODO_URL`); add
 * those from /studio rather than by hand.
 */

import rawOverrides from "./project-overrides.json";

export type CategoryId = "realtime" | "motion" | "ux";

/** Written by /studio in development; empty in a fresh checkout. */
const OVERRIDES = rawOverrides as Record<
  string,
  { thumbnail?: string; projectUrl?: string }
>;

export type Category = {
  id: CategoryId | "all";
  label: string;
  /** short label used on narrow viewports */
  short: string;
};

export const CATEGORIES: Category[] = [
  { id: "all", label: "All", short: "All" },
  { id: "realtime", label: "Realtime Experience", short: "Realtime" },
  { id: "motion", label: "Motion·3D", short: "Motion" },
  { id: "ux", label: "UX·UI", short: "UX·UI" },
];

export type Project = {
  id: string;
  category: CategoryId;
  title: string;
  /** small-caps eyebrow above the title */
  eyebrow: string;
  year: string;
  /** 역할 */
  role: string;
  /** 도구 */
  tools: string;
  /** 유형 */
  type: string;
  /** 요약 — the one-liner shown on cards */
  blurb: string;
  /** Body copy shown in the detail panel; "\n\n" separates paragraphs */
  summary: string;
  /** slash-separated tag row */
  tags: string[];
  /** Still shown on the card and in the detail panel. Swap from /studio. */
  thumbnail: string;
  /** TODO_URL — where the "View Project" button goes */
  projectUrl: string;
};

/** A `projectUrl` still set to this has no real link behind it yet. */
export const TODO_URL = "#";

const BASE_PROJECTS: Project[] = [
  /* ---------------------------------------------------- realtime (7) --- */
  {
    id: "the-flare",
    category: "realtime",
    title: "THE FLARE",
    eyebrow: "Realtime Installation",
    year: "2026",
    role: "경험 디자인 / 유니티 인터랙션 / 설치 작업",
    tools: "유니티 / 아두이노 / 마이크 센서",
    type: "실시간 인터랙티브 설치",
    blurb: "제스처 입력과 불꽃 시뮬레이션으로 감각적 피드백을 구현한 실시간 설치",
    summary:
      "영화 Whiplash를 주제로 한 실시간 인터랙티브 설치 작업입니다. 영화 Whiplash의 몰입과 소진의 감각을 '불타는 자신'이라는 이미지로 재해석했습니다. 사용자는 실제로 놓인 통나무 앞에서 부채질을 하고, 시스템은 마이크 센서를 통해 그 행위의 강도를 감지합니다. 일정 카운트를 넘어서면 불꽃은 정점에 도달한 뒤 모두 타버리고, 화면에는 재와 연기만 남도록 구현했습니다.",
    tags: ["INTERACTIVE", "REALTIME", "SENSOR"],
    thumbnail: "/thumbs/the-flare.webp",
    projectUrl: "https://www.youtube.com/watch?v=UwFO-dlauN0",
  },
  {
    id: "interactive-dooh",
    category: "realtime",
    title: "INTERACTIVE DOOH",
    eyebrow: "Out-of-Home Media",
    year: "2026",
    role: "경험 디자인 / 리얼타임 비주얼 / UX 디자인",
    tools: "TouchDesigner / Unreal Engine",
    type: "석사 졸업 프로젝트",
    blurb: "위치 기반 인터랙션으로 DOOH를 몰입적이고 반응적인 공공 경험으로 재해석한 프로젝트.",
    summary:
      "사용자의 위치 데이터를 기반으로 캐릭터가 실시간으로 반응하는 인터랙티브 DOOH 프로젝트입니다. 현재 옥외광고가 가진 일방향적 전달 방식의 한계를 돌파구로 설정하고, 이를 기억과 경험으로 확장하고자 했습니다. 홍대입구역이라는 실제 도심 위치를 반영해 사용자의 접근, 위치, 움직임에 따라 캐릭터가 반응하도록 설계했으며, 정보를 단순히 보는 행위보다 몰입적이고 참여적인 경험으로 전환하는 것을 목표로 했습니다.",
    tags: ["INTERACTIVE", "UX·UI", "MOTION·3D", "STRATEGY"],
    thumbnail: "/thumbs/interactive-dooh.webp",
    projectUrl: "https://www.youtube.com/watch?v=pVmaOwbiX9w",
  },
  {
    id: "design-is-to-attract",
    category: "realtime",
    title: "DESIGN IS TO ATTRACT",
    eyebrow: "Experimental DOOH",
    year: "2026",
    role: "경험 디자인 / 리얼타임 비주얼 / 인터랙션 디자인",
    tools: "TouchDesigner",
    type: "실험적 DOOH 프로젝트",
    blurb: "표정과 감정을 실시간으로 읽고, 위트 있는 타이포그래피와 비주얼로 미소를 유도하는 작업.",
    summary:
      "김보연 교수님의 'Design is to V'라는 관점에서 출발한 작업입니다. 이를 'Design is to Attract'로 해석해, 도시 속을 지나가는 사람이 잠시라도 멈추고 경험할 수 있도록 하는 것을 목표로 제작했습니다.\n\n다소 건방지고 당돌한 부산 특유의 사투리로 웃음을 유도했으며, 웃음 · 슬픔 · 분노의 감정을 데이터 값으로 설정해 각 트리거가 작동하도록 했습니다. 더 크게 웃을수록 추가적인 시각 반응이 나타나도록 설계했습니다.",
    tags: ["INTERACTIVE", "UX·UI", "MOTION·3D", "STRATEGY"],
    thumbnail: "/thumbs/design-is-to-attract.webp",
    projectUrl: "https://www.threads.com/@minho_ya_01/post/DJPCmufhkbI",
  },
  {
    id: "laughing-universe",
    category: "realtime",
    title: "LAUGHING UNIVERSE",
    eyebrow: "Exhibition Installation",
    year: "2026",
    role: "경험 디자인 / 리얼타임 비주얼 / 전시 설치",
    tools: "TouchDesigner",
    type: "팀 전시 프로젝트",
    blurb: "손짓과 웃음에 반응하는 인터랙티브 우주. 웃음이 터지는 순간, 우주는 점점 찬란하게 폭발합니다.",
    summary:
      "안국역 인근 바이브아트센터 전시에서 선보인 인터랙티브 설치 작품입니다. “누군가에겐 별게 아닐 수 있습니다”라는 관점에서 출발해, 사소해 보이는 감정과 웃음이 누군가에겐 하나의 우주처럼 확장될 수 있다는 메세지를 담았습니다.\n\n관객은 손짓으로 우주를 조작하고, 웃음이 감지되는 순간 우주가 터지듯 화려한 비주얼로 반응합니다. 전시장 내부에서 주조나 환경적으로 웃음을 유도하고 작품 참여 시 효과를 볼 수 있도록 설계했습니다.",
    tags: ["INTERACTIVE", "UX·UI", "MOTION·3D", "STRATEGY"],
    thumbnail: "/thumbs/laughing-universe.webp",
    projectUrl: "https://www.youtube.com/watch?v=I-KgWFnuZFg",
  },
  {
    id: "burts-bee-table",
    category: "realtime",
    title: "BURT'S BEE TARGET",
    eyebrow: "Interactive Table Service",
    year: "2026",
    role: "TODO_COPY — 역할",
    tools: "TODO_COPY — 도구",
    type: "TODO_COPY — 유형",
    blurb: "TODO_COPY — 한 줄 요약",
    summary:
      "TODO_COPY — 포트폴리오 PDF에 없던 작업입니다. 설명을 채워주세요.",
    tags: ["INTERACTIVE", "REALTIME", "RETAIL"],
    thumbnail: "/thumbs/burts-bee-table.webp",
    projectUrl: "https://www.youtube.com/shorts/3htRZNJ78uM",
  },
  {
    id: "fluid-audioreactive",
    category: "realtime",
    title: "FLUID AUDIOREACTIVE",
    eyebrow: "Audio-Reactive Visual",
    year: "2026",
    role: "TODO_COPY — 역할",
    tools: "TODO_COPY — 도구",
    type: "TODO_COPY — 유형",
    blurb: "TODO_COPY — 한 줄 요약",
    summary:
      "TODO_COPY — 포트폴리오 PDF에 없던 작업입니다. 설명을 채워주세요.",
    tags: ["INTERACTIVE", "REALTIME", "AUDIO"],
    thumbnail: "/thumbs/fluid-audioreactive.webp",
    projectUrl: "https://www.youtube.com/watch?v=hoU5xjEDC1c",
  },
  {
    id: "ar-pj-1",
    category: "realtime",
    title: "AR PJ 1",
    eyebrow: "Augmented Reality",
    year: "2026",
    role: "TODO_COPY — 역할",
    tools: "TODO_COPY — 도구",
    type: "TODO_COPY — 유형",
    blurb: "TODO_COPY — 한 줄 요약",
    summary:
      "TODO_COPY — 포트폴리오 PDF에 없던 작업입니다. 설명을 채워주세요.",
    tags: ["INTERACTIVE", "AR", "REALTIME"],
    thumbnail: "/thumbs/ar-pj-1.webp",
    projectUrl: "https://www.youtube.com/watch?v=V-QcXbkdlkQ",
  },
  /* ---------------------------------------------------- motion (7) --- */
  {
    id: "bloom",
    category: "motion",
    title: "BLOOM",
    eyebrow: "Media Art Motion",
    year: "2026",
    role: "3D 모션 디자인 / 비주얼 디렉션",
    tools: "Blender / Cinema4D",
    type: "미디어아트 모션 프로젝트",
    blurb: "달구벌 풍등축제에서 착안해 대구의 관광지를 풍등 오브제로 시각화한 3D 모션 작업.",
    summary:
      "대구 미디어아트 프로젝트 <Bloom>. 대구의 대표 축제인 달구벌 풍등축제에서 착안해, 풍등 하나하나에 대구의 매력적인 관광지를 담아 사람들이 이 도시를 직접 방문하길 바라는 의미를 담았습니다.\n\n풍등이 장소를 끌어올려, 도시의 기억과 여행의 기대를 함께 띄워 보내는 3D 모션 작업입니다.",
    tags: ["MOTION", "3D", "MEDIA ART"],
    thumbnail: "/thumbs/bloom.webp",
    projectUrl: "https://www.youtube.com/watch?v=BvyQOmedkdY",
  },
  {
    id: "dancheong",
    category: "motion",
    title: "DANCHEONG",
    eyebrow: "Traditional Pattern 3D",
    year: "2026",
    role: "3D 모델링 / 시뮬레이션 / 모션 디자인",
    tools: "Blender",
    type: "전통 문양 기반 3D 시뮬레이션",
    blurb: "한국 전통 문양을 재해석한 6가지 펜던트와 리짓 바디 시뮬레이션 기반 '리필' 연출.",
    summary:
      "한국의 전통 문양을 재해석해 6가지의 서로 다른 펜던트를 디자인하고 3D로 모델링했습니다. 여기에 한곳으로 모여드는 한국 특유의 정서를 담기 위해 리짓 바디(Rigid Body) 시뮬레이션을 적용했는데요.\n\n공간이 점점 차오르는 '리필(Refill)' 효과를 연출해 보았습니다.",
    tags: ["MOTION", "3D", "SIMULATION"],
    thumbnail: "/thumbs/dancheong.webp",
    projectUrl: "https://youtu.be/gH5Fj4FHK9g",
  },
  {
    id: "eye-balls",
    category: "motion",
    title: "EYE BALLS MOTION GRAPHIC",
    eyebrow: "Horror Motion Graphic",
    year: "2026",
    role: "3D 모션 디자인 / 비주얼 연출",
    tools: "Blender",
    type: "호러 3D 모션그래픽",
    blurb: "시선과 빛의 관계를 공포감 있는 비주얼로 풀어낸 3D 모션 작업입니다.",
    summary:
      "눈알들이 빛을 따라 움직이고, 동공의 확장과 수축을 통해 디스플레이 너머를 바라본다는 개념을 시각화한 호러 장르의 3D 모션그래픽 작업입니다.\n\n반복적으로 응시하는 시선과 강한 명암 대비를 통해 긴장감을 형성했고, 생물적인 움직임과 조형적 리듬이 동시에 느껴지도록 구성했습니다. 보는 행위 그 자체를 하나의 서스펜스로 전환한 실험적 영상 작업입니다.",
    tags: ["MOTION", "3D", "MEDIA ART"],
    thumbnail: "/thumbs/eye-balls.webp",
    projectUrl: "https://www.instagram.com/reels/DWaznDCk8Hx/",
  },
  {
    id: "apple-commercial-redesign",
    category: "motion",
    title: "APPLE COMMERCIAL REDESIGN",
    eyebrow: "Advertising Motion",
    year: "2026",
    role: "모션그래픽 디자인 / 3D 비주얼",
    tools: "Blender",
    type: "광고 모션그래픽 실험",
    blurb: "맥북 네오의 감각을 컬러풀한 모션으로 재해석한 광고 비주얼 작업입니다.",
    summary:
      "애플 맥북 네오가 출시된 후, 그에 맞는 광고 영상으로 기획한 작업입니다. Damonxart의 작품을 Blender로 재구성하여, 맥북 네오의 선명한 컬러감과 빠른 에너지를 다이내믹한 모션으로 풀어냈습니다.\n\n단순한 리디자인을 넘어, 브랜드의 감성과 그래픽 리듬을 재해석한 모션그래픽 실험 프로젝트입니다.",
    tags: ["MOTION", "3D", "ADVERTISING"],
    thumbnail: "/thumbs/apple-commercial-redesign.webp",
    projectUrl: "https://www.instagram.com/reels/DWZSr7hEyzv/",
  },
  {
    id: "po-plot-land",
    category: "motion",
    title: "PO-PLOT LAND",
    eyebrow: "Media Art Exhibition",
    year: "2026",
    role: "전시 기획 / 모션 비주얼",
    tools: "Blender / Mixamo",
    type: "미디어아트 전시 프로젝트",
    blurb: "춤추는 군중과 파티적 에너지를 통해 전시 오프닝을 시각화한 작업입니다.",
    summary:
      "Po-plot 작가와 함께 코엑스 World Art Expo 2025에서 진행한 미디어아트 전시 기획 작업입니다.\n\n20th Century Fox Records 오프닝에서 영감을 받아, Blender Particle 효과와 Mixamo의 10개 이상의 춤 동작을 활용해 춤추는 군중 구조를 표현했습니다. 전시 오프닝의 상징성과 대중적 리듬을 결합해, 시각적 몰입감이 강한 미디어아트 장면으로 확장한 프로젝트입니다.",
    tags: ["MOTION", "3D", "MEDIA ART"],
    thumbnail: "/thumbs/po-plot-land.webp",
    projectUrl: "https://www.threads.com/@minho_ya_01/post/DFceDnXPIEv",
  },
  {
    id: "avatar-level-design",
    category: "motion",
    title: "AVATAR LEVEL DESIGN",
    eyebrow: "Level & World Design",
    year: "2026",
    role: "TODO_COPY — 역할",
    tools: "TODO_COPY — 도구",
    type: "TODO_COPY — 유형",
    blurb: "TODO_COPY — 한 줄 요약",
    summary:
      "TODO_COPY — 포트폴리오 PDF에 없던 작업입니다. 설명을 채워주세요.",
    tags: ["MOTION", "3D", "WORLD"],
    thumbnail: "/thumbs/avatar-level-design.webp",
    projectUrl: "https://www.instagram.com/reels/DKu_KBsTGw3/",
  },
  {
    id: "hanja-graffiti",
    category: "motion",
    title: "KIM MINHO HANJA GRAFFITI",
    eyebrow: "Type & Graffiti",
    year: "2026",
    role: "TODO_COPY — 역할",
    tools: "TODO_COPY — 도구",
    type: "TODO_COPY — 유형",
    blurb: "TODO_COPY — 한 줄 요약",
    summary:
      "TODO_COPY — 포트폴리오 PDF에 없던 작업입니다. 설명을 채워주세요.",
    tags: ["MOTION", "3D", "TYPE"],
    thumbnail: "/thumbs/hanja-graffiti.webp",
    projectUrl: "https://www.threads.com/share/F-xdEMUCq/",
  },
  /* ---------------------------------------------------- ux (3) --- */
  {
    id: "pixafe",
    category: "ux",
    title: "PIXAFE",
    eyebrow: "Service & Campaign",
    year: "2026",
    role: "UX/UI 디자인 / 서비스 콘텐츠 기획",
    tools: "Adobe XD / Adobe Illustrator",
    type: "저작권 인식 캠페인 & NFT 서비스 UX/UI",
    blurb: "창작물 보호의 가치를 직관적으로 전달하는 디지털 서비스 설계",
    summary:
      "디지털 시대의 저작권 문제를 더 쉽고 직관적으로 전달하기 위해 기획한 UX/UI 프로젝트입니다. 디즈니를 연결한 이유는 상상력의 상징이면서 동시에 콘텐츠 보호의 대표적인 사례라고 생각했기 때문입니다.\n\n그래서 'Respect Imagination'이라는 메시저를 중심으로, 저작권 인식 캠페인과 NFT 기반 보호 서비스 UX/UI를 함께 설계했습니다. 사용자가 자연스럽게 저작권의 의미를 이해할 수 있도록 정보 구조와 인터랙션 흐름을 구성한 프로젝트입니다.",
    tags: ["UX·UI", "SERVICE", "NFT"],
    thumbnail: "/thumbs/pixafe.webp",
    projectUrl: "https://www.instagram.com/p/DFVaTZey2FQ/",
  },
  {
    id: "insidefeel-out",
    category: "ux",
    title: "INSIDEFEEL OUT",
    eyebrow: "Emotion Interface",
    year: "2026",
    role: "UI/UX Design / Prototyping",
    tools: "Adobe XD / Adobe Illustrator",
    type: "감정 인터페이스 UX/UI (2024.03 – 2024.05)",
    blurb: "발달장애인의 감정 표현과 소통을 돕는 인터페이스",
    summary:
      "발달장애인의 감정 표현과 소통을 돕기 위한 인터페이스를 주제로 진행한 프로젝트입니다. 사용자의 표정과 머무는 시간을 기반으로 감정 흐름을 파악하고, 이를 감정 디스플레이와 대시보드, 관리자 화면으로 설계했습니다.\n\n특히 인사이드아웃 캐릭터를 활용해 감정을 더 직관적이고 친숙하게 전달하고자 했습니다. 복잡한 설명보다 누구나 쉽게 이해할 수 있는 감정 경험을 만드는 데 집중한 프로젝트입니다.",
    tags: ["UX·UI", "EMOTION", "INTERFACE"],
    thumbnail: "/thumbs/insidefeel-out.webp",
    projectUrl: "https://www.instagram.com/p/DNa0bJwyaIs/",
  },
  {
    id: "sup",
    category: "ux",
    title: "S'UP",
    eyebrow: "Matching Service",
    year: "2026",
    role: "UX/UI 디자인 / 서비스 기획",
    tools: "Adobe XD / Adobe Illustrator",
    type: "관심사 기반 매칭 서비스",
    blurb: "공동 취향을 바탕으로 자연스러운 연결을 돕는 UX/UI 설계",
    summary:
      "같은 취미와 관심사를 가진 사람들이 더 편하게 연결될 수 있도록 기획한 매칭 서비스입니다. 단순히 사람을 이어주는 데 그치지 않고, 새로운 만남이 어색함과 불안을 줄이며 공동의 취향을 통해 자연스럽게 대화를 시작할 수 있는 흐름을 설계했습니다.\n\n특히 S'UP이라는 이름에는 같은 관심사로 연결되고, 가볍게 관계를 시작한다는 의미를 담았습니다. 사용자 경험을 더 쉽게 이해할 수 있도록 친숙한 비주얼과 명확한 UX 구조를 중심으로 구성한 프로젝트입니다.",
    tags: ["UX·UI", "MATCHING", "COMMUNITY"],
    thumbnail: "/thumbs/sup.webp",
    projectUrl: "https://www.instagram.com/p/DFNyfcgSp5K/",
  },
];

/**
 * Thumbnails and links can also be set from /studio while running `next dev`,
 * which writes them into project-overrides.json. Anything in there wins over
 * the placeholders above, so the site can be filled in without editing code.
 */
/**
 * Bump when a still is replaced under the same filename. /public is cached hard
 * by the browser, so swapping two images without changing their names leaves
 * everyone looking at the old pair.
 */
const THUMB_V = 3;
const versioned = (src: string) =>
  src.includes("?") ? src : `${src}?v=${THUMB_V}`;

export const PROJECTS: Project[] = BASE_PROJECTS.map((p) => ({
  ...p,
  thumbnail: versioned(p.thumbnail),
  // studio overrides carry their own cache-busting stamp
  ...(OVERRIDES[p.id] ?? {}),
}));

export const hasLink = (p: Project) => Boolean(p.projectUrl) && p.projectUrl !== TODO_URL;

export const countFor = (id: CategoryId | "all") =>
  id === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.category === id).length;

export const projectsFor = (id: CategoryId | "all") =>
  id === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === id);

/* -------------------------------------------------------------- tints --- */
/**
 * Each discipline carries its own liquid. Values are linear rgb for the tank
 * shader, not CSS — the accent orange stays the site's, and the other two are
 * pulled far enough apart in hue to be told apart at a glance.
 */
export const CATEGORY_TINT: Record<CategoryId, [number, number, number]> = {
  realtime: [1.0, 0.3, 0.11],
  motion: [0.66, 0.32, 1.0],
  ux: [0.06, 0.78, 0.95],
};

/* ------------------------------------------------------------- socials --- */
export const SOCIALS = [
  { label: "INSTAGRAM", href: "https://www.instagram.com/mho.xxv/" },
  { label: "THREADS", href: "https://www.threads.com/@minho_ya_01" },
  {
    label: "YOUTUBE",
    href: "https://youtube.com/channel/UCzvEbjghgfUZaj2v-uLIVjw",
  },
] as const;

/* -------------------------------------------------------------- contact --- */
export const CONTACT: [string, string][] = [
  ["Name", "Kim Minho / 김민호"],
  ["Discipline", "Realtime · Motion·3D · UX·UI"],
  ["Based in", "Seoul, KR"],
  ["Email", "TODO_COPY — email"],
  ["Availability", "TODO_COPY — 2026 —"],
];

/* -------------------------------------------------------------- assets --- */
/** TODO_ASSET — the full-bleed video behind the hero. */
export const HERO_BG_SRC = "/video/hero-bg.mp4";

export const SHOWREEL_SRC = "/video/showreel.mp4";

/** The reel runs a touch fast on purpose. */
export const SHOWREEL_PLAYBACK_RATE = 1.25;
