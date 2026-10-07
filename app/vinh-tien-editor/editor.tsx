"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Proxied source images; large photos come back as resized WebP (w px wide) to keep the page light. */
function sourceImage(src:string,w=2000){const origin='https://mat-bang-vinh-tien.lengocluan.chatgpt.site';const path=src.startsWith('/api/vinh-tien/')||src.startsWith('/api/files/')?src:src.startsWith('/')?'/api/vinh-tien'+src:src.startsWith(origin+'/')?'/api/vinh-tien'+src.slice(origin.length):src;return /^\/api\/vinh-tien\/((gallery-|villa-|amenity-)?perspectives\/[^?]+|poster-map)\.(png|jpe?g)$/i.test(path)?path+'?w='+w:path;}

type ContentState = {
  unitTitle: string;
  unitCode: string;
  landArea: string;
  builtArea: string;
  productType: string;
  handover: string;
  price: string;
  priceUnit: string;
};

type ImageSlot = { src: string; x: number; y: number; zoom: number };
type ImageSlots = {
  main: ImageSlot;
  map: ImageSlot;
  gallery1: ImageSlot;
  gallery2: ImageSlot;
  gallery3: ImageSlot;
};

type GallerySlotKey = "gallery1" | "gallery2" | "gallery3";

type PerspectiveItem = {
  id: string;
  src: string;
  name: string;
  uploaded?: boolean;
};

type MarkerState = { x: number; y: number; scale: number };

type SheetPricing = {
  priceBeforeVat: string;
  vat: string;
  maintenanceFee: string;
  totalPrice: string;
  constructionBeforeVat: string;
  constructionVat: string;
  constructionMaintenanceFee: string;
  constructionTotal: string;
  landBeforeVat: string;
  landVat: string;
  landMaintenanceFee: string;
  landTotal: string;
  bankAccount: string;
  inventoryDate: string;
  note: string;
  transferSigning: string;
  tenPercentAmount: string;
  tenPercentDate: string;
  twentyPercentContract: string;
  pricingReference: string;
};

type SavedEditorState = {
  content: ContentState;
  images: ImageSlots;
  perspectives: PerspectiveItem[];
  galleryPerspectives: PerspectiveItem[];
  activeGallerySlot: GallerySlotKey;
  villaPerspectives: PerspectiveItem[];
  activeVillaGallerySlot: GallerySlotKey;
  amenityPerspectives: PerspectiveItem[];
  activeAmenityGallerySlot: GallerySlotKey;
  mainMarker: MarkerState;
  mapMarker: MarkerState;
};

type UnitRecord = {
  id: string;
  name: string;
  state: SavedEditorState;
  locked?: boolean;
  color?: string;
  status?: "Còn hàng" | "Booking" | "Đã bán";
  zone?: string;
  direction?: string;
  position?: string;
  updatedAt?: string;
  pricing?: SheetPricing;
};

type SheetUnit = UnitCatalogItem & Pick<UnitRecord, "color" | "status" | "zone" | "direction" | "position" | "updatedAt" | "pricing">;
type SortMode = "sheet" | "price-asc" | "price-desc" | "area" | "updated";

type SavedPortfolioState = {
  version: 2;
  dataRevision?: string;
  activeUnitId: string;
  units: UnitRecord[];
};

type PendingMobileImage = { blob: Blob; filename: string; width: number; height: number };

const defaultContent: ContentState = {
  unitTitle: "Mã Căn",
  unitCode: "SX4-08",
  landArea: "75",
  builtArea: "242,6",
  productType: "Liền kề",
  handover: "Thô có thang",
  price: "11,85",
  priceUnit: "TỶ",
};

type UnitCatalogItem = Omit<ContentState, "unitTitle" | "priceUnit">;

const unitCatalogRevision = "vinh-tien-google-sheet-authoritative-v2";
const unitCatalog: UnitCatalogItem[] = [
  { unitCode: "VT40-18", landArea: "80", builtArea: "260.7", productType: "LK", handover: "Thô có thang", price: "12,27" },
  { unitCode: "SX9-44", landArea: "80", builtArea: "270.1", productType: "LK", handover: "Thô có thang", price: "13,34" },
  { unitCode: "SX4-22", landArea: "75", builtArea: "242.1", productType: "LK", handover: "Thô không thang", price: "11,44" },
  { unitCode: "SX4-08", landArea: "75", builtArea: "242.6", productType: "LK", handover: "Thô có thang", price: "11,85" },
  { unitCode: "VT40-44", landArea: "80", builtArea: "260.7", productType: "LK", handover: "Thô có thang", price: "12,35" },
  { unitCode: "SX29-13", landArea: "75", builtArea: "255.4", productType: "LK", handover: "Thô có thang", price: "12,51" },
  { unitCode: "SX5-15", landArea: "112.5", builtArea: "246.2", productType: "LK", handover: "Thô có thang", price: "14,54" },
  { unitCode: "SX5-13", landArea: "112.5", builtArea: "258.4", productType: "LK", handover: "Thô có thang", price: "14,52" },
  { unitCode: "SX29-14", landArea: "75", builtArea: "255.4", productType: "LK", handover: "Thô có thang", price: "12,51" },
  { unitCode: "VT39-13", landArea: "245,6", builtArea: "406,8", productType: "BTSL", handover: "Thô có thang", price: "25,92" },
  { unitCode: "VT41-112", landArea: "225", builtArea: "368,6", productType: "BTSL", handover: "Thô có thang", price: "23,53" },
  { unitCode: "VT-104", landArea: "100,1", builtArea: "333,3", productType: "LK", handover: "Thô không thang", price: "17,27" },
  { unitCode: "VT57-04", landArea: "234", builtArea: "385", productType: "BTSL", handover: "Thô có thang", price: "24,09" },
];

const defaultImages: ImageSlots = {
  main: { src: "/perspectives/pc-2.jpg", x: 50, y: 50, zoom: 1 },
  map: { src: "/poster-map.jpg", x: 50, y: 50, zoom: 1 },
  gallery1: { src: "/gallery-perspectives/lk-ch01-co-dien-co-mai-1.jpg", x: 50, y: 50, zoom: 1 },
  gallery2: { src: "/gallery-perspectives/lk-ch02-co-dien-khong-mai-1.jpg", x: 50, y: 50, zoom: 1 },
  gallery3: { src: "/gallery-perspectives/lk-ch03-co-dien-khong-mai-1.jpg", x: 50, y: 50, zoom: 1 },
};

const defaultPerspectives: PerspectiveItem[] = [
  { id: "pc-2", src: "/perspectives/pc-2.jpg", name: "pc 2.jpg" },
  { id: "sx2-ben-trai", src: "/perspectives/sx2-ben-trai.jpg", name: "SX2 - BÊN TRÁI.png" },
  { id: "sx6-ben-phai", src: "/perspectives/sx6-ben-phai.jpg", name: "SX6 BÊN PHẢI.png" },
  { id: "sx7-ben-trai", src: "/perspectives/sx7-ben-trai.jpg", name: "SX7 BÊN TRÁI.png" },
  { id: "sx7", src: "/perspectives/sx7.jpg", name: "SX7.png" },
  { id: "tren-cao-left-cau", src: "/perspectives/tren-cao-left-cau.jpg", name: "TRÊN CAO LEFT CẦU.jpg" },
  { id: "tren-cao-sx2", src: "/perspectives/tren-cao-sx2.jpg", name: "TRÊN CAO SX2.jpg" },
  { id: "vong-xoay-vt", src: "/perspectives/vong-xoay-vt.jpg", name: "VÒNG XOAY VT.png" },
  { id: "vt-sx6-sau-lung", src: "/perspectives/vt-sx6-sau-lung.jpg", name: "VT - SX6 SAU LƯNG.png" },
  { id: "vt-sx6", src: "/perspectives/vt-sx6.jpg", name: "VT - SX6.png" },
  { id: "vt41", src: "/perspectives/vt41.jpg", name: "VT41.png" },
];

const defaultGalleryPerspectives: PerspectiveItem[] = [
  { id: "lk-ch01", src: "/gallery-perspectives/lk-ch01-co-dien-co-mai-1.jpg", name: "Mẫu LK_CH01_Cổ điển có mái_1.jpg" },
  { id: "lk-ch02", src: "/gallery-perspectives/lk-ch02-co-dien-khong-mai-1.jpg", name: "Mẫu LK_CH02_Cổ điển không mái_1.jpg" },
  { id: "lk-ch03", src: "/gallery-perspectives/lk-ch03-co-dien-khong-mai-1.jpg", name: "Mẫu LK_CH03_Cổ điển không mái_1.jpg" },
  { id: "lk-ch04", src: "/gallery-perspectives/lk-ch04-co-dien-khong-mai-1.jpg", name: "Mẫu LK_CH04_Cổ điển không mái_1.jpg" },
  { id: "lk-ch06-1", src: "/gallery-perspectives/lk-ch06-co-dien-co-mai-1.jpg", name: "Mẫu LK_CH06_Cổ điển có mái_1.jpg" },
  { id: "lk-ch06-2", src: "/gallery-perspectives/lk-ch06-co-dien-co-mai-2.jpg", name: "Mẫu LK_CH06_Cổ điển có mái_2.jpg" },
  { id: "lk-ch07-1", src: "/gallery-perspectives/lk-ch07-tan-co-dien-khong-mai-1.jpg", name: "Mẫu LK_CH07_Tân cổ điển không mái _1.jpg" },
  { id: "lk-ch07-2", src: "/gallery-perspectives/lk-ch07-tan-co-dien-khong-mai-2.jpg", name: "Mẫu LK_CH07_Tân cổ điển không mái _2.jpg" },
  { id: "lk-ch08", src: "/gallery-perspectives/lk-ch08-co-dien-co-mai-1.jpg", name: "Mẫu LK_CH08_Cổ điển có mái_1.jpg" },
  { id: "lk-ch22-1", src: "/gallery-perspectives/lk-ch22-tan-co-dien-khong-mai-1.jpg", name: "Mẫu LK_CH22_Tân cổ điển không mái _1.jpg" },
  { id: "lk-ch22-2", src: "/gallery-perspectives/lk-ch22-tan-co-dien-khong-mai-2.jpg", name: "Mẫu LK_CH22_Tân cổ điển không mái _2.jpg" },
  { id: "lk-ch27", src: "/gallery-perspectives/lk-ch27-tan-co-dien-khong-mai-1.jpg", name: "Mẫu LK_CH27_Tân cổ điển không mái _1.jpg" },
  { id: "lk-ch31", src: "/gallery-perspectives/lk-ch31-nhat-ban-diem-nhan-1.jpg", name: "Mẫu LK_CH31_ Nhật bản điểm nhấn_1.jpg" },
];

const defaultVillaPerspectives: PerspectiveItem[] = [
  { id: "villa-songlap-ch27-1", src: "/villa-perspectives/songlap-ch27-tan-co-dien-khong-mai-1.jpg", name: "Mẫu song lập_CH27_Tân cổ điển không mái_1.jpg" },
  { id: "villa-donlap-ch02-1", src: "/villa-perspectives/donlap-ch02-co-dien-khong-mai-1.jpg", name: "Mẫu đơn lập_ CH02_Cổ điển không mái_1.jpg" },
  { id: "villa-donlap-ch02-2", src: "/villa-perspectives/donlap-ch02-co-dien-khong-mai-2.jpg", name: "Mẫu đơn lập_ CH02_Cổ điển không mái_2.jpg" },
  { id: "villa-donlap-c01-2", src: "/villa-perspectives/donlap-c01-co-dien-co-mai-2.jpg", name: "Mẫu đơn lập_C01 _Cổ điển có mái _2.jpg" },
  { id: "villa-donlap-c01-1", src: "/villa-perspectives/donlap-c01-co-dien-co-mai-1.jpg", name: "Mẫu đơn lập_C01 _Cổ điển có mái_1.jpg" },
  { id: "villa-donlap-ch03-1", src: "/villa-perspectives/donlap-ch03-co-dien-khong-mai-1.jpg", name: "Mẫu đơn lập_CH03_Cổ điển không mái_1.jpg" },
  { id: "villa-donlap-ch03-2", src: "/villa-perspectives/donlap-ch03-co-dien-khong-mai-2.jpg", name: "Mẫu đơn lập_CH03_Cổ điển không mái_2.jpg" },
  { id: "villa-donlap-ch08-1", src: "/villa-perspectives/donlap-ch08-co-dien-co-mai-1.jpg", name: "Mẫu đơn lập_CH08 _Cổ điển có mái_1.jpg" },
  { id: "villa-donlap-ch22-1", src: "/villa-perspectives/donlap-ch22-tan-co-dien-khong-mai-1.jpg", name: "Mẫu đơn lập_CH22_Tân cổ điển không mái_1.jpg" },
  { id: "villa-donlap-ch22-2", src: "/villa-perspectives/donlap-ch22-tan-co-dien-khong-mai-2.jpg", name: "Mẫu đơn lập_CH22_Tân cổ điển không mái_2.jpg" },
  { id: "villa-songlap-ch02-1", src: "/villa-perspectives/songlap-ch02-co-dien-khong-mai-1.jpg", name: "Mẫu song lập_ CH02_Cổ điển không mái_1.jpg" },
  { id: "villa-songlap-ch03-1", src: "/villa-perspectives/songlap-ch03-co-dien-khong-mai-1.jpg", name: "Mẫu song lập_ CH03_Cổ điển không mái_1.jpg" },
  { id: "villa-songlap-ch01-1", src: "/villa-perspectives/songlap-ch01-co-dien-co-mai-1.jpg", name: "Mẫu song lập_CH01_Cổ điển có mái_1.jpg" },
  { id: "villa-songlap-ch01-2", src: "/villa-perspectives/songlap-ch01-co-dien-co-mai-2.jpg", name: "Mẫu song lập_CH01_Cổ điển có mái_2.jpg" },
  { id: "villa-songlap-ch02-2", src: "/villa-perspectives/songlap-ch02-co-dien-khong-mai-2.jpg", name: "Mẫu song lập_CH02_Cổ điển không mái_2.jpg" },
  { id: "villa-songlap-ch03-2", src: "/villa-perspectives/songlap-ch03-co-dien-khong-mai-2.jpg", name: "Mẫu song lập_CH03_Cổ điển không mái_2.jpg" },
  { id: "villa-songlap-ch08-1", src: "/villa-perspectives/songlap-ch08-co-dien-co-mai-1.jpg", name: "Mẫu song lập_CH08_Cổ điển có mái_1.jpg" },
  { id: "villa-songlap-ch08-2", src: "/villa-perspectives/songlap-ch08-co-dien-co-mai-2.jpg", name: "Mẫu song lập_CH08_Cổ điển có mái_2.jpg" },
  { id: "villa-songlap-ch22-1", src: "/villa-perspectives/songlap-ch22-tan-co-dien-khong-mai-1.jpg", name: "Mẫu song lập_CH22_Tân cổ điển không mái_1.jpg" },
  { id: "villa-songlap-ch22-2", src: "/villa-perspectives/songlap-ch22-tan-co-dien-khong-mai-2.jpg", name: "Mẫu song lập_CH22_Tân cổ điển không mái_2.jpg" },
];

const defaultAmenityPerspectives: PerspectiveItem[] = [
  { id: "amenity-commercial-street", src: "/amenity-perspectives/tien-ich-pho-thuong-mai.png", name: "Tiện ích 1 – Phố thương mại & mua sắm.png" },
  { id: "amenity-golf-course", src: "/amenity-perspectives/tien-ich-san-golf.png", name: "Tiện ích 2 – Không gian sân golf.png" },
  { id: "amenity-beach-club", src: "/amenity-perspectives/tien-ich-beach-club.png", name: "Tiện ích 3 – Bãi biển & Lucian Beach Club.png" },
  { id: "amenity-waterfront-plaza", src: "/amenity-perspectives/tien-ich-quang-truong-ven-bien.png", name: "Tiện ích 4 – Quảng trường ven biển.png" },
];

function normalizeImageLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi");
}

function seededIndex(seed: string, length: number) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return length ? (hash >>> 0) % length : 0;
}

function applyAutomaticSmallImages(state: SavedEditorState, unitCode = state.content.unitCode, productType = state.content.productType): SavedEditorState {
  const normalizedType = normalizeImageLabel(productType);
  let perspectivePool: PerspectiveItem[] = [];

  if (normalizedType.includes("lien ke") || normalizedType === "lk") {
    perspectivePool = state.galleryPerspectives;
  } else {
    const typeName = normalizedType.includes("don lap") || normalizedType.includes("btdl")
      ? "don lap"
      : normalizedType.includes("song lap") || normalizedType.includes("btsl") || normalizedType === "sl"
        ? "song lap"
        : "";
    perspectivePool = typeName
      ? state.villaPerspectives.filter((item) => normalizeImageLabel(item.name).includes(typeName))
      : [];
  }

  if (!perspectivePool.length) perspectivePool = state.galleryPerspectives;
  const firstIndex = seededIndex(`${unitCode}|${productType}|perspective-1`, perspectivePool.length);
  const first = perspectivePool[firstIndex];
  const secondPool = perspectivePool.filter((_, index) => index !== firstIndex);
  const second = secondPool[seededIndex(`${unitCode}|${productType}|perspective-2`, secondPool.length)] ?? first;
  const amenity = state.amenityPerspectives[
    seededIndex(`${unitCode}|${productType}|amenity`, state.amenityPerspectives.length)
  ];

  if (!first || !second || !amenity) return state;
  return {
    ...state,
    images: {
      ...state.images,
      gallery1: { src: first.src, x: 50, y: 50, zoom: 1 },
      gallery2: { src: second.src, x: 50, y: 50, zoom: 1 },
      gallery3: { src: amenity.src, x: 50, y: 50, zoom: 1 },
    },
  };
}

function createDefaultEditorState(unitCode = defaultContent.unitCode): SavedEditorState {
  return {
    content: { ...defaultContent, unitCode },
    images: structuredClone(defaultImages),
    perspectives: [...defaultPerspectives],
    galleryPerspectives: [...defaultGalleryPerspectives],
    activeGallerySlot: "gallery1",
    villaPerspectives: [...defaultVillaPerspectives],
    activeVillaGallerySlot: "gallery1",
    amenityPerspectives: [...defaultAmenityPerspectives],
    activeAmenityGallerySlot: "gallery1",
    mainMarker: { x: 68, y: 61, scale: 1 },
    mapMarker: { x: 64, y: 63, scale: 1 },
  };
}

function createCatalogEditorState(item: UnitCatalogItem, base?: SavedEditorState): SavedEditorState {
  const state = base ? structuredClone(base) : createDefaultEditorState(item.unitCode);
  const withCatalogContent = {
    ...state,
    content: {
      ...state.content,
      unitTitle: "Mã Căn",
      priceUnit: "TỶ",
      ...item,
    },
  };
  return base ? withCatalogContent : applyAutomaticSmallImages(withCatalogContent, item.unitCode, item.productType);
}

function catalogUnitId(unitCode: string) {
  return `catalog-${unitCode.toLocaleLowerCase("vi").replace(/[^a-z0-9]+/g, "-")}`;
}

function createCatalogUnits() {
  return unitCatalog.map((item) => ({
    id: catalogUnitId(item.unitCode),
    name: item.unitCode,
    state: createCatalogEditorState(item),
  }));
}

function syncCatalogUnits(savedUnits: UnitRecord[], catalog: SheetUnit[] = unitCatalog) {
  const savedByCode = new Map(savedUnits.map((unit) => [unit.name.trim().toLocaleUpperCase("vi"), unit]));
  const savedById = new Map(savedUnits.map((unit) => [unit.id, unit]));
  return catalog.map((item) => {
    const id = catalogUnitId(item.unitCode);
    const existing = savedById.get(id) ?? savedByCode.get(item.unitCode.toLocaleUpperCase("vi"));
    return existing
      ? { ...existing, id, name: item.unitCode, color: item.color, status: item.status, zone: item.zone, direction: item.direction, position: item.position, updatedAt: item.updatedAt, pricing: item.pricing, state: createCatalogEditorState(item, existing.state) }
      : {
          id,
          name: item.unitCode,
          color: item.color,
          status: item.status,
          zone: item.zone,
          direction: item.direction,
          position: item.position,
          updatedAt: item.updatedAt,
          pricing: item.pricing,
          state: createCatalogEditorState(item),
        };
  });
}

function isPortfolioState(value: unknown): value is SavedPortfolioState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedPortfolioState>;
  return candidate.version === 2 && typeof candidate.activeUnitId === "string" && Array.isArray(candidate.units);
}

function cloneEditorState(state: SavedEditorState, unitCode: string): SavedEditorState {
  const clone = {
    ...structuredClone(state),
    content: { ...state.content, unitCode },
  };
  return applyAutomaticSmallImages(clone, unitCode, clone.content.productType);
}

const gallerySlots: Array<{ key: GallerySlotKey; label: string }> = [
  { key: "gallery1", label: "Ảnh nhỏ 1" },
  { key: "gallery2", label: "Ảnh nhỏ 2" },
  { key: "gallery3", label: "Ảnh nhỏ 3" },
];

const fieldGroups: Array<{ label: string; key: keyof ContentState; suffix?: string }> = [
  { label: "Dòng tiêu đề", key: "unitTitle" },
  { label: "Mã căn", key: "unitCode" },
  { label: "Diện tích đất", key: "landArea", suffix: "m²" },
  { label: "Diện tích xây dựng", key: "builtArea", suffix: "m²" },
  { label: "Loại hình", key: "productType" },
  { label: "Tiêu chuẩn bàn giao", key: "handover" },
  { label: "Giá bán", key: "price" },
  { label: "Đơn vị giá", key: "priceUnit" },
];

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function parseVietnameseNumber(value?: string) {
  if (!value) return 0;
  const compact = value.trim().replace(/\s/g, "");
  if (compact.includes(",")) return Number(compact.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(compact.replace(/,/g, "")) || 0;
}

function normalizeSearch(value?: string) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
}

function clampZoom(value: number) {
  return Math.min(4, Math.max(1, Math.round(value * 100) / 100));
}

function clampMarkerScale(value: number) {
  return Math.min(1.8, Math.max(.55, Math.round(value * 10) / 10));
}

function mergePerspectiveLibrary(defaults: PerspectiveItem[], saved: PerspectiveItem[] | undefined) {
  if (!saved?.length) return defaults;
  const defaultIds = new Set(defaults.map((item) => item.id));
  return [...defaults, ...saved.filter((item) => item.uploaded && !defaultIds.has(item.id))];
}

function DraggableImage({ slot, label, className = "", onMove, onUpload, onZoom, enableZoom = false, preserveQuality = false }: {
  slot: ImageSlot;
  label: string;
  className?: string;
  onMove: (x: number, y: number) => void;
  onUpload: (file: File) => void;
  onZoom?: (zoom: number) => void;
  enableZoom?: boolean;
  preserveQuality?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ pointerX: number; pointerY: number; imageX: number; imageY: number } | null>(null);
  const positionRef = useRef({ x: slot.x, y: slot.y });
  const zoomRef = useRef(slot.zoom);
  const animationRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const applyTransform = (x = positionRef.current.x, y = positionRef.current.y, zoom = zoomRef.current) => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image || !image.naturalWidth || !image.naturalHeight) return;
    const baseScale = Math.max(frame.clientWidth / image.naturalWidth, frame.clientHeight / image.naturalHeight);
    const width = image.naturalWidth * baseScale * zoom;
    const height = image.naturalHeight * baseScale * zoom;
    const maxX = Math.max(0, (width - frame.clientWidth) / 2);
    const maxY = Math.max(0, (height - frame.clientHeight) / 2);
    const translateX = ((50 - x) / 50) * maxX;
    const translateY = ((50 - y) / 50) * maxY;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    image.style.transform = `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0)`;
  };

  useEffect(() => {
    positionRef.current = { x: slot.x, y: slot.y };
    zoomRef.current = slot.zoom;
    applyTransform(slot.x, slot.y, slot.zoom);
  }, [slot.src, slot.x, slot.y, slot.zoom]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(() => applyTransform());
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input")) return;
    frameRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, imageX: slot.x, imageY: slot.y };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    const image = imageRef.current;
    const start = dragRef.current;
    if (!frame || !image || !start || !image.naturalWidth || !image.naturalHeight) return;
    const baseScale = Math.max(frame.clientWidth / image.naturalWidth, frame.clientHeight / image.naturalHeight);
    const width = image.naturalWidth * baseScale * zoomRef.current;
    const height = image.naturalHeight * baseScale * zoomRef.current;
    const maxX = Math.max(0, (width - frame.clientWidth) / 2);
    const maxY = Math.max(0, (height - frame.clientHeight) / 2);
    const startTranslateX = ((50 - start.imageX) / 50) * maxX;
    const startTranslateY = ((50 - start.imageY) / 50) * maxY;
    const nextTranslateX = Math.min(maxX, Math.max(-maxX, startTranslateX + event.clientX - start.pointerX));
    const nextTranslateY = Math.min(maxY, Math.max(-maxY, startTranslateY + event.clientY - start.pointerY));
    const x = maxX ? clamp(50 - (nextTranslateX / maxX) * 50) : 50;
    const y = maxY ? clamp(50 - (nextTranslateY / maxY) * 50) : 50;
    positionRef.current = { x, y };
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(() => {
      applyTransform(x, y, zoomRef.current);
    });
  };

  const stopDragging = () => {
    if (dragRef.current) onMove(positionRef.current.x, positionRef.current.y);
    dragRef.current = null;
    setDragging(false);
  };

  const setZoom = (nextZoom: number) => {
    const zoom = clampZoom(nextZoom);
    zoomRef.current = zoom;
    applyTransform(positionRef.current.x, positionRef.current.y, zoom);
    onZoom?.(zoom);
  };

  return (
    <div
      ref={frameRef}
      className={`image-frame ${className} ${dragging ? "is-dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      role="group"
      aria-label={label}
    >
      <img
        ref={imageRef}
        src={sourceImage(slot.src)}
        alt=""
        draggable={false}
        decoding={preserveQuality ? "sync" : "async"}
        data-preserve-quality={preserveQuality ? "true" : undefined}
        onLoad={() => applyTransform()}
      />
      <button className="frame-action" type="button" onClick={() => inputRef.current?.click()} aria-label={`Thay ${label.toLowerCase()}`}>
        <span>＋</span> Thay ảnh
      </button>
      {enableZoom && (
        <div className="zoom-controls" aria-label={`Thu phóng ${label.toLowerCase()}`}>
          <button type="button" onClick={() => setZoom(zoomRef.current - .25)} aria-label="Thu nhỏ ảnh">−</button>
          <output>{Math.round(slot.zoom * 100)}%</output>
          <button type="button" onClick={() => setZoom(zoomRef.current + .25)} aria-label="Phóng to ảnh">＋</button>
        </div>
      )}
      <span className="drag-tip">✥ Kéo ngang · kéo dọc</span>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onUpload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function DraggableMarker({ position, unitCode, onMove, onScale }: {
  position: MarkerState;
  unitCode: string;
  onMove: (x: number, y: number) => void;
  onScale: (scale: number) => void;
}) {
  const markerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number; width: number; height: number; markerWidth: number; markerHeight: number } | null>(null);
  const positionRef = useRef(position);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    positionRef.current = position;
    if (markerRef.current) {
      markerRef.current.style.left = `${position.x}%`;
      markerRef.current.style.top = `${position.y}%`;
    }
  }, [position]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.stopPropagation();
    const parent = markerRef.current?.parentElement;
    if (!parent) return;
    const markerRect = markerRef.current?.getBoundingClientRect();
    markerRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: positionRef.current.x,
      y: positionRef.current.y,
      width: parent.clientWidth,
      height: parent.clientHeight,
      markerWidth: markerRect?.width ?? 0,
      markerHeight: markerRect?.height ?? 0,
    };
    markerRef.current?.classList.add("is-dragging");
  };

  const moveMarker = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    if (!start) return;
    const minX = (start.markerWidth * .15 / start.width) * 100;
    const maxX = 100 - (start.markerWidth * .85 / start.width) * 100;
    const minY = (start.markerHeight * .76 / start.height) * 100;
    const maxY = 100 - (start.markerHeight * .24 / start.height) * 100;
    const x = Math.min(maxX, Math.max(minX, start.x + ((event.clientX - start.pointerX) / start.width) * 100));
    const y = Math.min(maxY, Math.max(minY, start.y + ((event.clientY - start.pointerY) / start.height) * 100));
    positionRef.current = { ...positionRef.current, x, y };
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(() => {
      if (!markerRef.current) return;
      markerRef.current.style.left = `${x}%`;
      markerRef.current.style.top = `${y}%`;
    });
  };

  const stopMarker = () => {
    if (dragRef.current) onMove(positionRef.current.x, positionRef.current.y);
    dragRef.current = null;
    markerRef.current?.classList.remove("is-dragging");
  };

  return (
    <div
      ref={markerRef}
      className="draggable-marker"
      style={{ left: `${position.x}%`, top: `${position.y}%`, transform: `translate(-15%,-76%) scale(${position.scale})` }}
      onPointerDown={startDrag}
      onPointerMove={moveMarker}
      onPointerUp={stopMarker}
      onPointerCancel={stopMarker}
      role="group"
      aria-label="Chỉ vị trí căn, kéo để di chuyển"
    >
      <span className="marker-art"><img src="/api/vinh-tien/unit-marker.png" alt="" draggable={false} /></span>
      <b>{unitCode}</b>
      <div className="marker-scale-controls" aria-label="Thay đổi kích thước chỉ vị trí">
        <button type="button" onClick={() => onScale(clampMarkerScale(position.scale - .1))} aria-label="Thu nhỏ chỉ vị trí">−</button>
        <output>{Math.round(position.scale * 100)}%</output>
        <button type="button" onClick={() => onScale(clampMarkerScale(position.scale + .1))} aria-label="Phóng to chỉ vị trí">＋</button>
      </div>
      <small>KÉO CHỈ CĂN</small>
    </div>
  );
}

function BatchExportPoster({ posterId, state }: { posterId: string; state: SavedEditorState }) {
  const noop = () => {};
  const { content, images, mainMarker, mapMarker } = state;
  return (
    <div className="poster is-exporting batch-poster" id={posterId}>
      <div className="poster-glow" />
      <section className="poster-head">
        <div className="project-lockup">
          <img className="brand-logo" src="/api/vinh-tien/brand-logo.png" alt="Vinhomes Green Paradise" />
        </div>
        <div className="property-data">
          <div className="unit-heading">
            {content.unitTitle.trim().toLocaleLowerCase("vi") === "mã căn"
              ? <img className="unit-title-image" src="/api/vinh-tien/unit-title.png" alt="Mã Căn" />
              : <em>{content.unitTitle}</em>}
            <strong>{content.unitCode}</strong>
          </div>
          <div className="spec-grid">
            <div className="spec-row"><span>Diện tích đất:</span><strong>{content.landArea} <small>m²</small></strong></div>
            <div className="spec-row"><span>Loại hình:</span><strong>{content.productType}</strong></div>
            <div className="spec-row"><span>Diện tích xây dựng:</span><strong>{content.builtArea} <small>m²</small></strong></div>
            <div className="spec-row"><span>Tiêu chuẩn BG:</span><strong>{content.handover}</strong></div>
          </div>
          <div className="price-row">
            <div><span>GIÁ BÁN:</span><small>(Giá chưa gồm VAT + KPBT)</small></div>
            <strong>{content.price} <b>{content.priceUnit.toLocaleUpperCase("vi")}</b></strong>
          </div>
        </div>
      </section>
      <section className="poster-main-image">
        <DraggableImage slot={images.main} label="Ảnh phối cảnh chính" enableZoom onMove={noop} onZoom={noop} onUpload={noop} />
        <DraggableMarker position={mainMarker} unitCode={content.unitCode} onMove={noop} onScale={noop} />
      </section>
      <div className="poster-lower-grid">
        <section className="poster-map-section">
          <DraggableImage className="map-image" slot={images.map} label="Ảnh mặt bằng tổng thể" enableZoom preserveQuality onMove={noop} onZoom={noop} onUpload={noop} />
          <DraggableMarker position={mapMarker} unitCode={content.unitCode} onMove={noop} onScale={noop} />
        </section>
        <section className="poster-gallery">
          <DraggableImage className="gallery-frame" slot={images.gallery1} label="Ảnh phối cảnh nhỏ 1" onMove={noop} onUpload={noop} />
          <DraggableImage className="gallery-frame" slot={images.gallery2} label="Ảnh phối cảnh nhỏ 2" onMove={noop} onUpload={noop} />
          <DraggableImage className="gallery-frame" slot={images.gallery3} label="Ảnh phối cảnh nhỏ 3" onMove={noop} onUpload={noop} />
        </section>
      </div>
    </div>
  );
}

type PricingPlan = "standard" | "early" | "loan70" | "loan80";
type VinClubTier = "none" | "gold" | "platinum" | "diamond";
type BirthdayTier = "none" | "member" | "gold" | "platinum" | "diamond";

const pricingPlans: Array<{ id: PricingPlan; short: string; title: string; note: string }> = [
  { id: "standard", short: "Chuẩn", title: "Thanh toán chuẩn", note: "Theo tiến độ" },
  { id: "early", short: "Sớm", title: "Thanh toán sớm", note: "Chiết khấu 9%" },
  { id: "loan70", short: "HTLS 70%", title: "Vay HTLS 70%", note: "18 tháng" },
  { id: "loan80", short: "HTLS 80%", title: "Vay HTLS 80%", note: "18 tháng" },
];

function parseMoneyValue(value?: string) {
  const digits = value?.replace(/[^0-9-]/g, "") ?? "";
  return Number(digits) || 0;
}

function money(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")} ₫`;
}

function shortMoney(value: number) {
  return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} T ₫`;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("vi-VN");
}

function calculatePlanTotal(originalTotal: number, preVat: number, plan: PricingPlan, discountRate: number, luckyMoney: boolean) {
  const planDiscountRate = plan === "early" ? .09 : 0;
  const discountBeforeVat = preVat * (discountRate + planDiscountRate) + (luckyMoney ? 33_000_000 : 0);
  const loanSurcharge = plan === "loan80" ? preVat * .032995088 : 0;
  return Math.round(originalTotal + loanSurcharge - discountBeforeVat * 1.1);
}

function PricingQuote({ unit, customer, quoteDate, plan, vinClub, birthday, noBankGuarantee, luckyMoney, aquafield }: {
  unit: UnitRecord;
  customer: string;
  quoteDate: string;
  plan: PricingPlan;
  vinClub: VinClubTier;
  birthday: BirthdayTier;
  noBankGuarantee: boolean;
  luckyMoney: boolean;
  aquafield: boolean;
}) {
  const pricing = unit.pricing;
  const content = unit.state.content;
  const preVat = parseMoneyValue(pricing?.priceBeforeVat);
  const vat = parseMoneyValue(pricing?.vat);
  const fee = parseMoneyValue(pricing?.maintenanceFee);
  const originalTotal = parseMoneyValue(pricing?.totalPrice) || preVat + vat + fee;
  const vinClubRates: Record<VinClubTier, number> = { none: 0, gold: .0015, platinum: .002, diamond: .0025 };
  const birthdayRates: Record<BirthdayTier, number> = { none: 0, member: .003, gold: .009, platinum: .012, diamond: .015 };
  const policyRate = vinClubRates[vinClub] + birthdayRates[birthday] + (noBankGuarantee ? .005 : 0);
  const totals = Object.fromEntries(pricingPlans.map((item) => [item.id, calculatePlanTotal(originalTotal, preVat, item.id, policyRate, luckyMoney)])) as Record<PricingPlan, number>;
  const selectedPlan = pricingPlans.find((item) => item.id === plan) ?? pricingPlans[0];
  const selectedTotal = totals[plan];
  const discount = Math.max(0, originalTotal - selectedTotal);
  const paymentBase = Math.max(0, selectedTotal - fee);
  const fifteenPercent = Math.round(paymentBase * .15);
  const deposit = Math.min(300_000_000, fifteenPercent);
  const lastPayment = Math.round(paymentBase * .25);
  const schedule = [
    ["Đặt cọc", "Ngày T", new Date(`${quoteDate}T00:00:00`).toLocaleDateString("vi-VN"), deposit, "Cọc và ký TTĐC"],
    ["Lần 1", "T + 15 ngày", addDays(quoteDate, 15), fifteenPercent - deposit, "Đã trừ tiền cọc"],
    ["Lần 2", "T + 30 ngày", addDays(quoteDate, 30), fifteenPercent, ""],
    ["Lần 3", "T + 75 ngày", addDays(quoteDate, 75), fifteenPercent, ""],
    ["Lần 4", "T + 135 ngày", addDays(quoteDate, 135), fifteenPercent, ""],
    ["Lần 5", "T + 195 ngày", addDays(quoteDate, 195), fifteenPercent, ""],
    ["Lần 6", "Dự kiến T + 360", addDays(quoteDate, 360), lastPayment, "Bàn giao"],
    ["KPBT", "Khi bàn giao", addDays(quoteDate, 360), fee, "100% KPBT"],
  ] as const;
  return (
    <article className="pricing-sheet pricing-quote-document">
      <header className="pricing-sheet-head pricing-quote-head">
        <div><span>BẢNG GIÁ THAM KHẢO</span><h2>Vinhomes Green Paradise</h2><p>Kính gửi: <strong>{customer || "Quý Khách hàng"}</strong></p></div>
        <aside><small>MÃ SẢN PHẨM</small><strong>{content.unitCode}</strong><span>{selectedPlan.title}</span></aside>
      </header>
      <section className="pricing-property-grid">
        <div><small>Phân khu</small><strong>{unit.zone || "Vịnh Tiên"}</strong></div>
        <div><small>Diện tích đất</small><strong>{content.landArea} m²</strong></div>
        <div><small>DT xây dựng</small><strong>{content.builtArea} m²</strong></div>
        <div><small>Loại hình</small><strong>{content.productType}</strong></div>
      </section>
      <section className="pricing-summary-cards">
        <article><small>Giá niêm yết</small><strong>{money(preVat)}</strong><span>Chưa VAT</span></article>
        <article className="discount-card"><small>Tổng ưu đãi trừ giá</small><strong>-{money(discount)}</strong><span>{discount ? "Đã áp dụng" : "Chưa áp dụng"}</span></article>
        <article className="total-card"><small>Giá sau ưu đãi</small><strong>{money(selectedTotal)}</strong><span>Đã gồm VAT & KPBT</span></article>
      </section>
      <div className="pricing-detail-grid">
        <section className="pricing-document-block">
          <div className="pricing-document-title"><span>02</span><h3>Chi tiết giá bán</h3></div>
          <div className="pricing-document-rows">
            <div><span>Giá bán chưa VAT</span><strong>{money(preVat)}</strong></div>
            <div><span>Sau chiết khấu · chưa VAT</span><strong>{money(Math.max(0, preVat - preVat * (policyRate + (plan === "early" ? .09 : 0)) - (luckyMoney ? 33_000_000 : 0)))}</strong></div>
            <div><span>Thuế VAT tạm tính</span><strong>{money(vat)}</strong></div>
            <div><span>Phí bảo trì</span><strong>{money(fee)}</strong></div>
            <div className="grand-total"><span>Tổng giá trị thanh toán</span><strong>{money(selectedTotal)}</strong></div>
          </div>
          {aquafield && <div className="pricing-benefit"><strong>Quyền lợi ngoài giá</strong><span>Quà Aquafield: 20.000.000 ₫</span></div>}
        </section>
        <section className="pricing-document-block">
          <div className="pricing-document-title"><span>03</span><h3>So sánh phương án</h3></div>
          <div className="pricing-plan-comparison">{pricingPlans.map((item) => <div className={item.id === plan ? "is-active" : ""} key={item.id}><span><strong>{item.title}</strong><small>{item.note}</small></span><b>{shortMoney(totals[item.id])}</b></div>)}</div>
        </section>
      </div>
      <section className="pricing-document-block pricing-schedule-block">
        <div className="pricing-document-title"><span>04</span><h3>Tiến độ thanh toán</h3></div>
        <div className="pricing-table-wrap"><table><thead><tr><th>Đợt</th><th>Thời hạn</th><th>Ngày dự kiến</th><th>Số tiền</th><th>Ghi chú</th></tr></thead><tbody>{schedule.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><strong>{money(row[3])}</strong></td><td>{row[4]}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>TỔNG</td><td>{money(selectedTotal)}</td><td>Đã gồm KPBT</td></tr></tfoot></table></div>
      </section>
      <footer className="pricing-sheet-foot"><span><b>Lưu ý:</b> Phiếu tính giá mang tính tham khảo để tư vấn khách hàng, chưa phải thông báo chính thức từ Chủ đầu tư.</span><strong>Lập ngày {new Date(`${quoteDate}T00:00:00`).toLocaleDateString("vi-VN")}</strong></footer>
    </article>
  );
}

export default function Home() {
  const [canEdit,setCanEdit]=useState(false);
  const [embedded,setEmbedded]=useState(false);
  useEffect(()=>{setEmbedded(new URLSearchParams(window.location.search).get("embed")==="1");},[]);
  useEffect(()=>{if(!embedded)return;let last=0;const send=()=>{const h=document.querySelector(".studio-app")?.scrollHeight||document.body.scrollHeight;if(Math.abs(h-last)>2){last=h;window.parent.postMessage({type:"vinh-tien-height",h},window.location.origin);}};const ro=new ResizeObserver(send);const el=document.querySelector(".studio-app");if(el)ro.observe(el);send();const t=setInterval(send,1500);return()=>{ro.disconnect();clearInterval(t);};},[embedded]);
  const editVersion=useRef(0),savedVersion=useRef(0);
  const markEdited=()=>{editVersion.current+=1;};
  const requestedCode=useRef("");
  useEffect(()=>{requestedCode.current=new URLSearchParams(window.location.search).get("code")||"";},[]);
  const initialUnits = useRef<UnitRecord[]>(createCatalogUnits());
  const [units, setUnits] = useState<UnitRecord[]>(initialUnits.current);
  const [activeUnitId, setActiveUnitId] = useState(initialUnits.current[0].id);
  const [newUnitCode, setNewUnitCode] = useState("");
  const [unitMessage, setUnitMessage] = useState("");
  const [content, setContent] = useState<ContentState>(initialUnits.current[0].state.content);
  const [images, setImages] = useState<ImageSlots>(defaultImages);
  const [perspectives, setPerspectives] = useState<PerspectiveItem[]>(defaultPerspectives);
  const [galleryPerspectives, setGalleryPerspectives] = useState<PerspectiveItem[]>(defaultGalleryPerspectives);
  const [activeGallerySlot, setActiveGallerySlot] = useState<GallerySlotKey>("gallery1");
  const [villaPerspectives, setVillaPerspectives] = useState<PerspectiveItem[]>(defaultVillaPerspectives);
  const [activeVillaGallerySlot, setActiveVillaGallerySlot] = useState<GallerySlotKey>("gallery1");
  const [amenityPerspectives, setAmenityPerspectives] = useState<PerspectiveItem[]>(defaultAmenityPerspectives);
  const [activeAmenityGallerySlot, setActiveAmenityGallerySlot] = useState<GallerySlotKey>("gallery1");
  const [mainMarker, setMainMarker] = useState<MarkerState>({ x: 68, y: 61, scale: 1 });
  const [mapMarker, setMapMarker] = useState<MarkerState>({ x: 64, y: 63, scale: 1 });
  const [exporting, setExporting] = useState(false);
  const [exportMode, setExportMode] = useState<"single" | "multiple">("single");
  const [selectedExportUnitIds, setSelectedExportUnitIds] = useState<string[]>([]);
  const [exportMessage, setExportMessage] = useState("");
  const [pendingMobileImage, setPendingMobileImage] = useState<PendingMobileImage | null>(null);
  const [stateReady, setStateReady] = useState(false);
  useEffect(()=>{if(stateReady)window.parent.postMessage({type:"vinh-tien-mode",canEdit},window.location.origin);},[stateReady,canEdit]);
  const [saveStatus, setSaveStatus] = useState<"loading" | "saving" | "saved" | "error">("loading");
  const [sheetStatus, setSheetStatus] = useState<"syncing" | "synced" | "error">("syncing");
  const [lastSheetSync, setLastSheetSync] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("sheet");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [showFilteredUnitList, setShowFilteredUnitList] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingCustomer, setPricingCustomer] = useState("Quý Khách hàng");
  const [pricingDate, setPricingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pricingPlan, setPricingPlan] = useState<PricingPlan>("standard");
  const [pricingVinClub, setPricingVinClub] = useState<VinClubTier>("none");
  const [pricingBirthday, setPricingBirthday] = useState<BirthdayTier>("none");
  const [pricingNoBankGuarantee, setPricingNoBankGuarantee] = useState(false);
  const [pricingLuckyMoney, setPricingLuckyMoney] = useState(false);
  const [pricingAquafield, setPricingAquafield] = useState(true);
  const unitsRef = useRef(units);
  const activeUnitIdRef = useRef(activeUnitId);
  const editorSnapshotRef = useRef<SavedEditorState>({
    content, images, perspectives, galleryPerspectives, activeGallerySlot,
    villaPerspectives, activeVillaGallerySlot, amenityPerspectives, activeAmenityGallerySlot,
    mainMarker, mapMarker,
  });
  unitsRef.current = units;
  activeUnitIdRef.current = activeUnitId;
  editorSnapshotRef.current = {
    content, images, perspectives, galleryPerspectives, activeGallerySlot,
    villaPerspectives, activeVillaGallerySlot, amenityPerspectives, activeAmenityGallerySlot,
    mainMarker, mapMarker,
  };
  const perspectiveInputRef = useRef<HTMLInputElement>(null);
  const galleryPerspectiveInputRef = useRef<HTMLInputElement>(null);
  const villaPerspectiveInputRef = useRef<HTMLInputElement>(null);
  const amenityPerspectiveInputRef = useRef<HTMLInputElement>(null);
  const activeUnit = units.find((unit) => unit.id === activeUnitId) ?? units[0];
  const isActiveUnitLocked = Boolean(activeUnit?.locked);
  const activeUnitIsRed = activeUnit?.color?.toLocaleUpperCase("vi") === "#E53935";
  const zones = useMemo(() => [...new Set(units.map((unit) => unit.zone).filter(Boolean))].sort(), [units]);
  const productTypes = useMemo(() => [...new Set(units.map((unit) => unit.state.content.productType).filter(Boolean))].sort(), [units]);
  const directions = useMemo(() => [...new Set(units.map((unit) => unit.direction).filter(Boolean))].sort(), [units]);
  const positions = useMemo(() => [...new Set(units.map((unit) => unit.position).filter(Boolean))].sort(), [units]);
  const filteredUnits = useMemo(() => {
    const search = normalizeSearch(unitSearch);
    const minPriceValue = parseVietnameseNumber(minPrice);
    const maxPriceValue = parseVietnameseNumber(maxPrice);
    const minAreaValue = parseVietnameseNumber(minArea);
    const maxAreaValue = parseVietnameseNumber(maxArea);
    const result = units.filter((unit) => {
      const price = parseVietnameseNumber(unit.state.content.price);
      const area = parseVietnameseNumber(unit.state.content.landArea);
      return (!search || normalizeSearch(unit.name).includes(search))
        && (!statusFilter || (unit.status ?? "Còn hàng") === statusFilter)
        && (!zoneFilter || unit.zone === zoneFilter)
        && (!typeFilter || unit.state.content.productType === typeFilter)
        && (!minPriceValue || price >= minPriceValue)
        && (!maxPriceValue || price <= maxPriceValue)
        && (!minAreaValue || area >= minAreaValue)
        && (!maxAreaValue || area <= maxAreaValue)
        && (!directionFilter || unit.direction === directionFilter)
        && (!positionFilter || unit.position === positionFilter);
    });
    return result.sort((a, b) => {
      if (sortMode === "sheet") return 0;
      if (sortMode === "price-asc") return parseVietnameseNumber(a.state.content.price) - parseVietnameseNumber(b.state.content.price);
      if (sortMode === "price-desc") return parseVietnameseNumber(b.state.content.price) - parseVietnameseNumber(a.state.content.price);
      if (sortMode === "area") return parseVietnameseNumber(a.state.content.landArea) - parseVietnameseNumber(b.state.content.landArea);
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });
  }, [units, unitSearch, statusFilter, zoneFilter, typeFilter, minPrice, maxPrice, minArea, maxArea, directionFilter, positionFilter, sortMode]);

  const activeFilterChips = [
    unitSearch && { key: "search", label: `Mã: ${unitSearch}`, clear: () => setUnitSearch("") },
    statusFilter && { key: "status", label: statusFilter, clear: () => setStatusFilter("") },
    zoneFilter && { key: "zone", label: `Phân khu: ${zoneFilter}`, clear: () => setZoneFilter("") },
    typeFilter && { key: "type", label: typeFilter, clear: () => setTypeFilter("") },
    (minPrice || maxPrice) && { key: "price", label: `Giá: ${minPrice || "0"}–${maxPrice || "∞"} tỷ`, clear: () => { setMinPrice(""); setMaxPrice(""); } },
    (minArea || maxArea) && { key: "area", label: `DT: ${minArea || "0"}–${maxArea || "∞"} m²`, clear: () => { setMinArea(""); setMaxArea(""); } },
    directionFilter && { key: "direction", label: `Hướng: ${directionFilter}`, clear: () => setDirectionFilter("") },
    positionFilter && { key: "position", label: `Vị trí: ${positionFilter}`, clear: () => setPositionFilter("") },
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  const clearAllFilters = () => {
    setUnitSearch(""); setStatusFilter(""); setZoneFilter(""); setTypeFilter(""); setMinPrice(""); setMaxPrice("");
    setMinArea(""); setMaxArea(""); setDirectionFilter(""); setPositionFilter("");
  };

  const buildCurrentSnapshot = (): SavedEditorState => ({
    content,
    images,
    perspectives,
    galleryPerspectives,
    activeGallerySlot,
    villaPerspectives,
    activeVillaGallerySlot,
    amenityPerspectives,
    activeAmenityGallerySlot,
    mainMarker,
    mapMarker,
  });

  const hydrateEditor = (saved: SavedEditorState) => {
    setContent(saved.content ?? defaultContent);
    setImages(saved.images ?? defaultImages);
    setPerspectives(mergePerspectiveLibrary(defaultPerspectives, saved.perspectives));
    setGalleryPerspectives(mergePerspectiveLibrary(defaultGalleryPerspectives, saved.galleryPerspectives));
    setActiveGallerySlot(saved.activeGallerySlot ?? "gallery1");
    setVillaPerspectives(mergePerspectiveLibrary(defaultVillaPerspectives, saved.villaPerspectives));
    setActiveVillaGallerySlot(saved.activeVillaGallerySlot ?? "gallery1");
    setAmenityPerspectives(mergePerspectiveLibrary(defaultAmenityPerspectives, saved.amenityPerspectives));
    setActiveAmenityGallerySlot(saved.activeAmenityGallerySlot ?? "gallery1");
    setMainMarker(saved.mainMarker ?? { x: 68, y: 61, scale: 1 });
    setMapMarker(saved.mapMarker ?? { x: 64, y: 63, scale: 1 });
  };

  useEffect(() => {
    let cancelled = false;
    const restoreLatestState = async () => {
      let restoredUnits = initialUnits.current;
      let restoredActiveId = restoredUnits[0].id;
      try {
        const response = await fetch("/api/vinh-tien/api/state", { cache: "no-store" });
        if (!response.ok) throw new Error("Không thể đọc bản lưu");
        const result = await response.json() as { state: SavedPortfolioState | SavedEditorState | null; canEdit?:boolean };
        if(!cancelled){const q=new URLSearchParams(window.location.search);setCanEdit(result.canEdit===true&&(q.get("embed")!=="1"||q.get("mode")==="edit"));}
        if (!cancelled && result.state) {
          if (isPortfolioState(result.state) && result.state.units.length) {
            restoredUnits = result.state.units;
            restoredActiveId = result.state.activeUnitId;
          } else {
            const legacy = result.state as SavedEditorState;
            const code = legacy.content?.unitCode || defaultContent.unitCode;
            const migratedUnit = { id: `unit-${crypto.randomUUID()}`, name: code, state: legacy };
            restoredUnits = [migratedUnit];
            restoredActiveId = migratedUnit.id;
          }
          setExportMessage("Đã khôi phục bản chỉnh sửa gần nhất.");
        }
        if (!cancelled) setSaveStatus("saved");
      } catch {
        if (!cancelled) setSaveStatus("error");
      }

      try {
        const response = await fetch("/api/vinh-tien/api/sheet", { cache: "no-store" });
        if (!response.ok) throw new Error("Không thể đọc Google Sheets");
        const result = await response.json() as { units: SheetUnit[]; syncedAt: string };
        restoredUnits = syncCatalogUnits(restoredUnits, result.units);
        if (!cancelled) {
          setSheetStatus("synced");
          setLastSheetSync(result.syncedAt);
        }
      } catch {
        if (!cancelled) setSheetStatus("error");
      }

      if (!cancelled) {
        const active = restoredUnits.find(unit=>unit.state.content.unitCode===requestedCode.current) ?? restoredUnits.find((unit) => unit.id === restoredActiveId) ?? restoredUnits[0];
        setUnits(restoredUnits);
        setActiveUnitId(active.id);
        hydrateEditor(active.state);
        setStateReady(true);
      }
    };
    restoreLatestState();
    return () => { cancelled = true; };
  }, []);

  const refreshFromSheet = async (force = false) => {
    if (!stateReady) return;
    setSheetStatus("syncing");
    try {
      const response = await fetch(force ? `/api/vinh-tien/api/sheet?force=${Date.now()}` : "/api/vinh-tien/api/sheet", { cache: "no-store" });
      if (!response.ok) throw new Error("Không thể đọc Google Sheets");
      const result = await response.json() as { units: SheetUnit[]; syncedAt: string; stale?: boolean };
      const currentUnits = unitsRef.current.map((unit) => unit.id === activeUnitIdRef.current ? { ...unit, state: editorSnapshotRef.current } : unit);
      const syncedUnits = syncCatalogUnits(currentUnits, result.units);
      const active = syncedUnits.find((unit) => unit.id === activeUnitIdRef.current) ?? syncedUnits[0];
      setUnits(syncedUnits);
      setActiveUnitId(active.id);
      hydrateEditor(active.state);
      setLastSheetSync(result.syncedAt);
      setSheetStatus(result.stale ? "error" : "synced");
      setUnitMessage(result.stale ? "Chưa đọc được thay đổi mới nhất; đang dùng lần đồng bộ Sheet gần nhất." : `Đã đồng bộ chính xác ${result.units.length} mã căn từ Google Sheets.`);
    } catch {
      setSheetStatus("error");
      setUnitMessage("Chưa thể đồng bộ Google Sheets. Website vẫn giữ dữ liệu gần nhất.");
    }
  };

  useEffect(() => {
    if (!stateReady) return;
    const timer = window.setInterval(() => { void refreshFromSheet(false); }, 60_000);
    return () => window.clearInterval(timer);
  }, [stateReady]);

  useEffect(() => {
    if (!stateReady) return;
    const snapshot = buildCurrentSnapshot();
    setUnits((current) => current.map((unit) => unit.id === activeUnitId
      ? { ...unit, name: content.unitCode.trim() || "Chưa đặt mã", state: snapshot }
      : unit));
  }, [stateReady, activeUnitId, content, images, perspectives, galleryPerspectives, activeGallerySlot, villaPerspectives, activeVillaGallerySlot, amenityPerspectives, activeAmenityGallerySlot, mainMarker, mapMarker]);

  useEffect(() => {
    if (!stateReady || !canEdit || editVersion.current===savedVersion.current) return;
    setSaveStatus("saving");
    const timer = window.setTimeout(async () => {
      const versionBeingSaved=editVersion.current;
      const snapshot: SavedPortfolioState = { version: 2, dataRevision: unitCatalogRevision, activeUnitId, units };
      try {
        const response = await fetch("/api/vinh-tien/api/state", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (!response.ok) throw new Error("Không thể lưu");
        savedVersion.current=versionBeingSaved;
        setSaveStatus(editVersion.current===versionBeingSaved?"saved":"saving");
      } catch {
        setSaveStatus("error");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [stateReady, activeUnitId, units, canEdit]);

  useEffect(() => {
    const validIds = new Set(units.map((unit) => unit.id));
    setSelectedExportUnitIds((current) => current.filter((id) => validIds.has(id)));
  }, [units]);

  const uploadAsset = async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    const dataUrl = `data:${file.type};base64,${btoa(binary)}`;
    const response = await fetch("/api/vinh-tien/api/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl, name: file.name, type: file.type }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(detail.error || "Không thể tải ảnh lên");
    }
    return await response.json() as { key: string; url: string; name: string };
  };

  const replaceImageWithUpload = async (key: keyof ImageSlots, file: File) => {
    setExportMessage(`Đang tải “${file.name}”…`);
    try {
      const asset = await uploadAsset(file);
      updateImage(key, { src: asset.url, x: 50, y: 50, zoom: 1 });
      setExportMessage(key === "map"
        ? `Đã thay Ảnh số 2 bằng “${asset.name}” · đã lưu vào Cloudflare.`
        : `Đã thay ảnh bằng “${asset.name}” và tự động lưu.`);
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "Không thể tải ảnh. Vui lòng thử lại.");
    }
  };

  const updateField = (key: keyof ContentState, value: string) => {
    if (isActiveUnitLocked) return;
    const nextContent = { ...content, [key]: value };
    setContent(nextContent);
    if (key === "productType") {
      const nextState = applyAutomaticSmallImages(
        { ...buildCurrentSnapshot(), content: nextContent },
        nextContent.unitCode,
        value,
      );
      setImages(nextState.images);
      setUnitMessage(`Đã tự chọn 2 phối cảnh ${value || "phù hợp"} và 1 ảnh tiện ích cho 3 ảnh nhỏ. Hai ảnh lớn được giữ nguyên.`);
    }
  };

  const updateImage = (key: keyof ImageSlots, patch: Partial<ImageSlot>) => {
    if (isActiveUnitLocked) return;
    setImages((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  };

  const selectUnit = (unitId: string) => {
    if (unitId === activeUnitId) return;
    const target = units.find((unit) => unit.id === unitId);
    if (!target) return;
    const currentSnapshot = buildCurrentSnapshot();
    setUnits((current) => current.map((unit) => unit.id === activeUnitId
      ? { ...unit, name: content.unitCode.trim() || "Chưa đặt mã", state: currentSnapshot }
      : unit));
    setActiveUnitId(target.id);
    hydrateEditor(target.state);
    setUnitMessage(`Đang hiển thị thông tin và hình ảnh của mã ${target.name}.`);
    setExportMessage("");
  };

  useEffect(()=>{if(stateReady)window.parent.postMessage({type:'vinh-tien-selected',code:content.unitCode},window.location.origin);},[stateReady,content.unitCode]);
  useEffect(()=>{const listener=(e:MessageEvent)=>{if(e.origin!==window.location.origin||e.source!==window.parent||e.data?.type!=='vinh-tien-select')return;const target=unitsRef.current.find(u=>u.state.content.unitCode===e.data.code);if(target)selectUnit(target.id);};window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);});
  const addUnit = () => {
    const code = newUnitCode.trim();
    if (!code) {
      setUnitMessage("Hãy nhập mã căn mới trước khi thêm.");
      return;
    }
    if (units.some((unit) => unit.name.toLocaleLowerCase("vi") === code.toLocaleLowerCase("vi"))) {
      setUnitMessage(`Mã ${code} đã có trong danh sách.`);
      return;
    }
    const currentSnapshot = buildCurrentSnapshot();
    const id = `unit-${crypto.randomUUID()}`;
    const nextState = cloneEditorState(currentSnapshot, code);
    setUnits((current) => [
      ...current.map((unit) => unit.id === activeUnitId
        ? { ...unit, name: content.unitCode.trim() || "Chưa đặt mã", state: currentSnapshot }
        : unit),
      { id, name: code, state: nextState },
    ]);
    setActiveUnitId(id);
    hydrateEditor(nextState);
    setNewUnitCode("");
    setUnitMessage(`Đã tạo mã ${code} từ mẫu hiện tại. Bạn có thể thay nội dung và ảnh riêng cho mã này.`);
  };

  const deleteActiveUnit = () => {
    if (isActiveUnitLocked) {
      setUnitMessage(`Mã ${activeUnit?.name ?? "đang chọn"} đang khóa. Hãy mở khóa trước khi xóa.`);
      return;
    }
    if (units.length <= 1) {
      setUnitMessage("Cần giữ lại ít nhất một mã căn.");
      return;
    }
    const active = units.find((unit) => unit.id === activeUnitId);
    if (!window.confirm(`Xóa mã ${active?.name ?? "đang chọn"} và toàn bộ nội dung, hình ảnh riêng của mã này?`)) return;
    const remaining = units.filter((unit) => unit.id !== activeUnitId);
    const next = remaining[0];
    setUnits(remaining);
    setActiveUnitId(next.id);
    hydrateEditor(next.state);
    setUnitMessage(`Đã xóa mã ${active?.name ?? "đã chọn"}. Đang hiển thị mã ${next.name}.`);
    setExportMessage("");
  };

  const resetTemplate = () => {
    if (isActiveUnitLocked) return;
    perspectives.filter((item) => item.uploaded).forEach((item) => URL.revokeObjectURL(item.src));
    galleryPerspectives.filter((item) => item.uploaded).forEach((item) => URL.revokeObjectURL(item.src));
    villaPerspectives.filter((item) => item.uploaded).forEach((item) => URL.revokeObjectURL(item.src));
    amenityPerspectives.filter((item) => item.uploaded).forEach((item) => URL.revokeObjectURL(item.src));
    const currentCode = content.unitCode.trim() || defaultContent.unitCode;
    hydrateEditor(createDefaultEditorState(currentCode));
    setUnitMessage(`Đã đặt lại mẫu ban đầu cho riêng mã ${currentCode}.`);
    setExportMessage("");
  };

  const toggleActiveUnitLock = () => {
    const nextLocked = !isActiveUnitLocked;
    setUnits((current) => current.map((unit) => unit.id === activeUnitId ? { ...unit, locked: nextLocked } : unit));
    setUnitMessage(nextLocked
      ? `Đã khóa mã ${activeUnit?.name}. Dữ liệu và thiết kế của mã này sẽ không bị thay đổi.`
      : `Đã mở khóa mã ${activeUnit?.name}. Mã này sẽ tiếp tục nhận cập nhật từ Google Sheets.`);
  };

  const addPerspectives = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setExportMessage(`Đang tải ${imageFiles.length} ảnh…`);
    let assets: Array<{ url: string; name: string }>;
    try {
      assets = await Promise.all(imageFiles.map(uploadAsset));
    } catch {
      setExportMessage("Không thể tải ảnh. Vui lòng thử lại.");
      return;
    }
    const batch = Date.now();
    const newItems = assets.map((asset, index) => ({ id: `upload-${batch}-${index}`, src: asset.url, name: asset.name, uploaded: true }));
    setPerspectives((current) => [
      ...current,
      ...newItems,
    ]);
    updateImage("main", { src: newItems[0].src, x: 50, y: 50, zoom: 1 });
    setExportMessage(`Đã thêm ${imageFiles.length} ảnh và chọn “${newItems[0].name}” cho Ảnh số 1.`);
  };

  const removePerspective = (id: string) => {
    const item = perspectives.find((entry) => entry.id === id);
    if (item?.src === images.main.src) {
      updateImage("main", { src: defaultPerspectives[0].src, x: 50, y: 50, zoom: 1 });
    }
    if (item?.uploaded) URL.revokeObjectURL(item.src);
    setPerspectives((current) => current.filter((entry) => entry.id !== id));
  };

  const selectPerspective = (item: PerspectiveItem) => {
    updateImage("main", { src: item.src, x: 50, y: 50, zoom: 1 });
    setExportMessage(`Đã thay Ảnh số 1 bằng “${item.name}”.`);
  };

  const addGalleryPerspectives = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setExportMessage(`Đang tải ${imageFiles.length} ảnh liền kề…`);
    let assets: Array<{ url: string; name: string }>;
    try { assets = await Promise.all(imageFiles.map(uploadAsset)); }
    catch { setExportMessage("Không thể tải ảnh. Vui lòng thử lại."); return; }
    const batch = Date.now();
    const newItems = assets.map((asset, index) => ({ id: `gallery-upload-${batch}-${index}`, src: asset.url, name: asset.name, uploaded: true }));
    setGalleryPerspectives((current) => [...current, ...newItems]);
    updateImage(activeGallerySlot, { src: newItems[0].src, x: 50, y: 50, zoom: 1 });
    const slotLabel = gallerySlots.find((slot) => slot.key === activeGallerySlot)?.label ?? "Ảnh nhỏ";
    setExportMessage(`Đã thêm ${imageFiles.length} ảnh và chọn “${newItems[0].name}” cho ${slotLabel}.`);
  };

  const removeGalleryPerspective = (id: string) => {
    const item = galleryPerspectives.find((entry) => entry.id === id);
    if (!item) return;
    setImages((current) => {
      const next = { ...current };
      gallerySlots.forEach(({ key }, index) => {
        if (next[key].src === item.src) {
          next[key] = { ...defaultImages[key], src: defaultGalleryPerspectives[index].src };
        }
      });
      return next;
    });
    if (item.uploaded) URL.revokeObjectURL(item.src);
    setGalleryPerspectives((current) => current.filter((entry) => entry.id !== id));
  };

  const selectGalleryPerspective = (item: PerspectiveItem) => {
    updateImage(activeGallerySlot, { src: item.src, x: 50, y: 50, zoom: 1 });
    const slotLabel = gallerySlots.find((slot) => slot.key === activeGallerySlot)?.label ?? "Ảnh nhỏ";
    setExportMessage(`Đã thay ${slotLabel} bằng “${item.name}”.`);
  };

  const addVillaPerspectives = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setExportMessage(`Đang tải ${imageFiles.length} ảnh biệt thự…`);
    let assets: Array<{ url: string; name: string }>;
    try { assets = await Promise.all(imageFiles.map(uploadAsset)); }
    catch { setExportMessage("Không thể tải ảnh. Vui lòng thử lại."); return; }
    const batch = Date.now();
    const newItems = assets.map((asset, index) => ({ id: `villa-upload-${batch}-${index}`, src: asset.url, name: asset.name, uploaded: true }));
    setVillaPerspectives((current) => [...current, ...newItems]);
    updateImage(activeVillaGallerySlot, { src: newItems[0].src, x: 50, y: 50, zoom: 1 });
    const slotLabel = gallerySlots.find((slot) => slot.key === activeVillaGallerySlot)?.label ?? "Ảnh nhỏ";
    setExportMessage(`Đã thêm ${imageFiles.length} ảnh biệt thự và chọn “${newItems[0].name}” cho ${slotLabel}.`);
  };

  const removeVillaPerspective = (id: string) => {
    const item = villaPerspectives.find((entry) => entry.id === id);
    if (!item) return;
    setImages((current) => {
      const next = { ...current };
      gallerySlots.forEach(({ key }) => {
        if (next[key].src === item.src) next[key] = { ...defaultImages[key] };
      });
      return next;
    });
    if (item.uploaded) URL.revokeObjectURL(item.src);
    setVillaPerspectives((current) => current.filter((entry) => entry.id !== id));
  };

  const selectVillaPerspective = (item: PerspectiveItem) => {
    updateImage(activeVillaGallerySlot, { src: item.src, x: 50, y: 50, zoom: 1 });
    const slotLabel = gallerySlots.find((slot) => slot.key === activeVillaGallerySlot)?.label ?? "Ảnh nhỏ";
    setExportMessage(`Đã thay ${slotLabel} bằng phối cảnh biệt thự “${item.name}”.`);
  };

  const addAmenityPerspectives = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setExportMessage(`Đang tải ${imageFiles.length} ảnh tiện ích…`);
    let assets: Array<{ url: string; name: string }>;
    try { assets = await Promise.all(imageFiles.map(uploadAsset)); }
    catch { setExportMessage("Không thể tải ảnh. Vui lòng thử lại."); return; }
    const batch = Date.now();
    const newItems = assets.map((asset, index) => ({ id: `amenity-upload-${batch}-${index}`, src: asset.url, name: asset.name, uploaded: true }));
    setAmenityPerspectives((current) => [...current, ...newItems]);
    updateImage(activeAmenityGallerySlot, { src: newItems[0].src, x: 50, y: 50, zoom: 1 });
    const slotLabel = gallerySlots.find((slot) => slot.key === activeAmenityGallerySlot)?.label ?? "Ảnh nhỏ";
    setExportMessage(`Đã thêm ${imageFiles.length} ảnh tiện ích và chọn “${newItems[0].name}” cho ${slotLabel}.`);
  };

  const removeAmenityPerspective = (id: string) => {
    const item = amenityPerspectives.find((entry) => entry.id === id);
    if (!item) return;
    setImages((current) => {
      const next = { ...current };
      gallerySlots.forEach(({ key }) => {
        if (next[key].src === item.src) next[key] = { ...defaultImages[key] };
      });
      return next;
    });
    if (item.uploaded) URL.revokeObjectURL(item.src);
    setAmenityPerspectives((current) => current.filter((entry) => entry.id !== id));
  };

  const selectAmenityPerspective = (item: PerspectiveItem) => {
    updateImage(activeAmenityGallerySlot, { src: item.src, x: 50, y: 50, zoom: 1 });
    const slotLabel = gallerySlots.find((slot) => slot.key === activeAmenityGallerySlot)?.label ?? "Ảnh nhỏ";
    setExportMessage(`Đã thay ${slotLabel} bằng phối cảnh tiện ích “${item.name}”.`);
  };

  const makePosterJpeg = async (poster: HTMLElement) => {
    const posterImages = Array.from(poster.querySelectorAll<HTMLImageElement>("img"));
    const waitForImage = async (image: HTMLImageElement) => {
      if (!image.complete || !image.naturalWidth) {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error("Ảnh tải quá lâu")), 20_000);
          image.addEventListener("load", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
          image.addEventListener("error", () => { window.clearTimeout(timeout); reject(new Error("Không thể đọc ảnh")); }, { once: true });
        });
      }
      if (image.decode) await image.decode().catch(() => undefined);
    };

    await Promise.all(posterImages.map(waitForImage));

    /*
     * Safari on iOS can finish drawing the poster before asynchronously loaded
     * images have been copied into the renderer's cloned tree. Inline every
     * image first so the export no longer depends on network/cache timing.
     */
    const originalSources: Array<{ image: HTMLImageElement; src: string }> = [];
    const originalDecoding = posterImages.map((image) => ({ image, decoding: image.decoding }));
    try {
      for (const image of posterImages) {
        image.decoding = "sync";
        const source = image.currentSrc || image.src;
        if (!source || source.startsWith("data:")) continue;
        const response = await fetch(source, { cache: "force-cache", credentials: "same-origin" });
        if (!response.ok) throw new Error("Có ảnh chưa tải xong");
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không thể nhúng ảnh"));
          reader.onerror = () => reject(new Error("Không thể nhúng ảnh"));
          reader.readAsDataURL(blob);
        });
        originalSources.push({ image, src: image.getAttribute("src") || source });
        image.src = dataUrl;
        await waitForImage(image);
      }
    } catch (error) {
      originalSources.forEach(({ image, src }) => { image.src = src; });
      originalDecoding.forEach(({ image, decoding }) => { image.decoding = decoding; });
      throw error;
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const sourceRect = poster.getBoundingClientRect();
    const fullWidth = Math.ceil(sourceRect.width);
    const fullHeight = Math.ceil(sourceRect.height);
    /*
     * Only image #2 (the map) is allowed to raise export resolution. Its
     * original pixels are kept by the upload API, then this ratio avoids
     * shrinking those pixels again when the complete poster is rasterized.
     */
    const qualityImage = poster.querySelector<HTMLImageElement>('img[data-preserve-quality="true"]');
    const qualityRect = qualityImage?.getBoundingClientRect();
    const mapPixelRatio = qualityImage && qualityRect?.width && qualityRect.height
      ? Math.max(
          qualityImage.naturalWidth / qualityRect.width,
          qualityImage.naturalHeight / qualityRect.height,
        )
      : 2;
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const desiredPixelRatio = Math.max(2, 1600 / fullWidth, mapPixelRatio);
    const pixelRatio = mobile
      ? Math.max(1.75, Math.min(2.5, 1200 / fullWidth, desiredPixelRatio))
      : Math.min(5.5, desiredPixelRatio);
    try {
      const { toCanvas } = await import("html-to-image");
      const renderPoster = (ratio: number) => toCanvas(poster, {
        pixelRatio: ratio,
        width: fullWidth,
        height: fullHeight,
        style: {
          left: "0",
          margin: "0",
          maxWidth: `${fullWidth}px`,
          right: "auto",
          transform: "none",
          width: `${fullWidth}px`,
        },
        skipFonts: true,
        skipAutoScale: true,
        backgroundColor: "#003f37",
      });

      /*
       * WebKit may return the first foreign-object snapshot before every image
       * layer is painted. A low-resolution warm-up primes those layers without
       * affecting the final file or the desktop path.
      */
      if (mobile) {
        await renderPoster(1).catch(() => undefined);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      }
      const canvas = await renderPoster(pixelRatio);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Không thể tạo tệp JPEG")), "image/jpeg", .98);
      });
      return { blob, width: canvas.width, height: canvas.height };
    } finally {
      originalSources.forEach(({ image, src }) => { image.src = src; });
      originalDecoding.forEach(({ image, decoding }) => { image.decoding = decoding; });
    }
  };

  const safeUnitCode = (code: string) => code.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "ma-can";

  const triggerDownload = (blob: Blob, filename: string) => {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
  };

  const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const saveImageToPhone = async () => {
    if (!pendingMobileImage) return;
    const { blob, filename } = pendingMobileImage;
    const file = new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: filename });
        setExportMessage("Đã mở ảnh trên điện thoại. Nếu chưa tự lưu, hãy chọn “Lưu hình ảnh” hoặc ứng dụng Ảnh/Google Photos.");
      } else {
        triggerDownload(blob, filename);
        setExportMessage(`Đã tải ${filename}. Bạn có thể tìm ảnh trong thư mục Tải xuống (Downloads).`);
      }
      setPendingMobileImage(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setExportMessage("Bạn đã đóng bảng lưu ảnh. Nhấn lại “Lưu vào thư viện ảnh” khi cần.");
        return;
      }
      triggerDownload(blob, filename);
      setPendingMobileImage(null);
      setExportMessage(`Đã tải ${filename} vào thư mục Tải xuống (Downloads).`);
    }
  };

  const exportPosters = async () => {
    if (exporting) return;
    const isMultiple = exportMode === "multiple";
    const currentSnapshot = buildCurrentSnapshot();
    const unitsForExport = units.map((unit) => unit.id === activeUnitId ? { ...unit, state: currentSnapshot, name: content.unitCode } : unit);
    const exportUnits = isMultiple
      ? unitsForExport.filter((unit) => selectedExportUnitIds.includes(unit.id))
      : unitsForExport.filter((unit) => unit.id === activeUnitId);
    if (!exportUnits.length) {
      setExportMessage("Hãy chọn ít nhất một mã căn cần tải.");
      return;
    }
    setUnits(unitsForExport);
    setPendingMobileImage(null);
    setExporting(true);
    setExportMessage(isMultiple ? `Đang tạo ${exportUnits.length} ảnh và đóng gói ZIP…` : "Đang tạo ảnh JPEG của mã đang chọn…");
    const visiblePoster = document.getElementById("property-poster");
    if (!isMultiple) visiblePoster?.classList.add("is-exporting");
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!isMultiple) {
        if (!visiblePoster) throw new Error("Không tìm thấy poster");
        const result = await makePosterJpeg(visiblePoster);
        const code = safeUnitCode(content.unitCode);
        const filename = `${code}-bang-thong-tin.jpg`;
        if (isMobileDevice()) {
          setPendingMobileImage({ blob: result.blob, filename, width: result.width, height: result.height });
          setExportMessage(`Ảnh ${filename} đã sẵn sàng · ${result.width} × ${result.height}px. Nhấn nút bên dưới để lưu vào thư viện ảnh.`);
        } else {
          triggerDownload(result.blob, filename);
          setExportMessage(`Đã tải ảnh ${filename} · ${result.width} × ${result.height}px.`);
        }
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (let index = 0; index < exportUnits.length; index += 1) {
          const unit = exportUnits[index];
          setExportMessage(`Đang tạo ảnh ${index + 1}/${exportUnits.length}: ${unit.name}…`);
          const poster = document.getElementById(`batch-poster-${unit.id}`);
          if (!poster) throw new Error(`Không tìm thấy poster ${unit.name}`);
          const result = await makePosterJpeg(poster);
          zip.file(`${safeUnitCode(unit.state.content.unitCode)}-bang-thong-tin.jpg`, result.blob);
        }
        setExportMessage("Đang hoàn tất tệp ZIP…");
        const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
        triggerDownload(zipBlob, `bang-thong-tin-${exportUnits.length}-ma-can.zip`);
        setExportMessage(`Đã tải tệp ZIP gồm ${exportUnits.length} mã căn.`);
      }
    } catch (error) {
      setExportMessage(error instanceof Error && /ảnh/i.test(error.message)
        ? "Có ảnh chưa tải hoàn tất nên hệ thống đã dừng xuất để tránh tạo tệp bị thiếu. Vui lòng chờ vài giây rồi thử lại."
        : "Chưa thể xuất ảnh. Vui lòng thử lại sau vài giây.");
    } finally {
      visiblePoster?.classList.remove("is-exporting");
      setExporting(false);
    }
  };

  /*
   * Poster export deliberately renders batch posters off-screen so every unit
   * keeps its own crops, zoom levels and marker positions without changing the
   * unit currently being edited.
   */
  const exportJpeg = async () => {
    await exportPosters();
  };

  const exportPricingImage = async () => {
    if (exporting || !activeUnit) return;
    const exportRoot = document.getElementById("product-pricing-export");
    if (!exportRoot) return;
    setPendingMobileImage(null);
    setExporting(true);
    setExportMessage(`Đang tạo ảnh thông tin sản phẩm và phiếu tính giá ${content.unitCode}…`);
    exportRoot.querySelector(".poster")?.classList.add("is-exporting");
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const result = await makePosterJpeg(exportRoot);
      const filename = `${safeUnitCode(content.unitCode)}-thong-tin-va-phieu-tinh-gia.jpg`;
      if (isMobileDevice()) {
        setPendingMobileImage({ blob: result.blob, filename, width: result.width, height: result.height });
        setExportMessage(`Ảnh ${filename} đã sẵn sàng. Nhấn “Lưu vào thư viện ảnh” bên dưới.`);
      } else {
        triggerDownload(result.blob, filename);
        setExportMessage(`Đã tải ảnh ${filename} · ${result.width} × ${result.height}px.`);
      }
    } catch {
      setExportMessage("Chưa thể tạo ảnh phiếu tính giá. Vui lòng chờ ảnh tải xong rồi thử lại.");
    } finally {
      exportRoot.querySelector(".poster")?.classList.remove("is-exporting");
      setExporting(false);
    }
  };

  return (
    <main className={`studio-app ${canEdit?"is-editor":"is-viewer"}${embedded?" is-embed":""}`} onChangeCapture={canEdit?markEdited:undefined} onPointerUpCapture={canEdit?markEdited:undefined} onClickCapture={canEdit?markEdited:undefined}>
      <header className="studio-header">
        <div className="studio-brand">
          <span className="va-mark"><b>VA</b></span>
          <span><strong>VIETALAND STUDIO</strong><small>Property presentation builder</small></span>
        </div>
        <div className="header-status"><span />{canEdit?"Quản trị · Tự động lưu":<a href="/dang-nhap?return_to=%2Fdu-an%2Fvinhomes-green-paradise%2Fquy-can-360" target="_top">Chế độ xem · Đăng nhập quản trị để chỉnh sửa</a>}</div>
      </header>

      <div className="studio-layout">
        <aside className={`editor-panel ${isActiveUnitLocked ? "is-unit-locked" : ""}`} aria-label="Bảng chỉnh sửa nội dung">
          <section className="unit-manager" aria-label="Quản lý nhiều mã căn">
            <div className="unit-manager-head">
              <div><span>QUẢN LÝ SẢN PHẨM</span><strong>Danh sách mã căn</strong></div>
              <b>{filteredUnits.length}/{units.length} MÃ</b>
            </div>
            <div className="unit-filter-bar">
              <label className="unit-search-control">
                <span>🔎</span>
                <input value={unitSearch} onChange={(event) => setUnitSearch(event.target.value)} placeholder="Tìm mã căn…" aria-label="Tìm mã căn" />
                {unitSearch && <button type="button" onClick={() => setUnitSearch("")} aria-label="Xóa tìm kiếm">×</button>}
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Lọc trạng thái">
                <option value="">Tất cả trạng thái</option><option>Còn hàng</option><option>Booking</option><option>Đã bán</option>
              </select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Lọc loại căn">
                <option value="">Tất cả loại căn</option>{productTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              <div className="price-filter-pair"><input inputMode="decimal" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Giá từ" aria-label="Giá từ" /><input inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Đến" aria-label="Giá đến" /></div>
              <button className="advanced-filter-trigger" type="button" onClick={() => setAdvancedFiltersOpen(true)}>☰ Bộ lọc</button>
            </div>
            <div className={`advanced-filter-panel ${advancedFiltersOpen ? "is-open" : ""}`}>
              <button className="advanced-filter-backdrop" type="button" onClick={() => setAdvancedFiltersOpen(false)} aria-label="Đóng bộ lọc" />
              <div className="advanced-filter-sheet">
                <div className="advanced-filter-head"><strong>Bộ lọc nâng cao</strong><button type="button" onClick={() => setAdvancedFiltersOpen(false)}>×</button></div>
                <label><span>Phân khu</span><select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}><option value="">Tất cả phân khu</option>{zones.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
                <div className="advanced-range"><label><span>Diện tích từ (m²)</span><input inputMode="decimal" value={minArea} onChange={(event) => setMinArea(event.target.value)} placeholder="0" /></label><label><span>Đến (m²)</span><input inputMode="decimal" value={maxArea} onChange={(event) => setMaxArea(event.target.value)} placeholder="Không giới hạn" /></label></div>
                <label><span>Hướng</span><select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)} disabled={!directions.length}><option value="">{directions.length ? "Tất cả hướng" : "Chưa có dữ liệu hướng"}</option>{directions.map((direction) => <option key={direction}>{direction}</option>)}</select></label>
                <label><span>Vị trí</span><select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)} disabled={!positions.length}><option value="">{positions.length ? "Tất cả vị trí" : "Chưa có dữ liệu vị trí"}</option>{positions.map((position) => <option key={position}>{position}</option>)}</select></label>
                <button className="advanced-filter-apply" type="button" onClick={() => setAdvancedFiltersOpen(false)}>Xem {filteredUnits.length} căn phù hợp</button>
              </div>
            </div>
            {activeFilterChips.length > 0 && <div className="filter-chips">{activeFilterChips.map((chip) => <button type="button" key={chip.key} onClick={chip.clear}>{chip.label} <b>×</b></button>)}<button className="clear-all-filters" type="button" onClick={clearAllFilters}>Xóa tất cả</button></div>}
            <div className="filter-result-row">
              <div className="filter-result-count"><b>{filteredUnits.length}</b><span>căn phù hợp</span></div>
              <div className="filter-result-actions">
                <button className="show-unit-list-button" type="button" aria-expanded={showFilteredUnitList} aria-controls="filtered-unit-list" onClick={() => setShowFilteredUnitList((current) => !current)}>{showFilteredUnitList ? "Thu gọn" : "Xem"}</button>
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Sắp xếp"><option value="sheet">Thứ tự file Excel</option><option value="updated">Mới cập nhật</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option><option value="area">Diện tích</option></select>
              </div>
            </div>
            <label className="unit-select-label">
              <span>Chọn mã để hiển thị</span>
              <select value={filteredUnits.some((unit) => unit.id === activeUnitId) ? activeUnitId : ""} onChange={(event) => selectUnit(event.target.value)} aria-label="Chọn mã căn" className={activeUnitIsRed ? "is-red-unit" : ""}>
                {!filteredUnits.some((unit) => unit.id === activeUnitId) && <option value="">Chọn một căn phù hợp</option>}
                {filteredUnits.map((unit) => <option value={unit.id} key={unit.id} className={unit.color === "#E53935" ? "is-red-unit" : ""}>{unit.locked ? "🔒 " : ""}{unit.color === "#E53935" ? "🔴 " : unit.status === "Booking" ? "🟠 " : ""}{unit.name} · {unit.state.content.price} tỷ</option>)}
              </select>
            </label>
            {showFilteredUnitList && (
              <div className="filtered-unit-list" id="filtered-unit-list" aria-label="Tất cả mã căn phù hợp">
                {filteredUnits.map((unit) => (
                  <button className={`${unit.id === activeUnitId ? "is-active" : ""} ${unit.color === "#E53935" ? "is-sold" : unit.status === "Booking" ? "is-booking" : ""}`} type="button" onClick={() => selectUnit(unit.id)} key={unit.id}>
                    <span className="unit-list-status" aria-hidden="true" />
                    <strong>{unit.name}</strong>
                    <small>{unit.state.content.price} tỷ</small>
                  </button>
                ))}
                {!filteredUnits.length && <p>Không có mã căn phù hợp với bộ lọc.</p>}
              </div>
            )}
            <div className="unit-add-row">
              <input
                value={newUnitCode}
                onChange={(event) => setNewUnitCode(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") addUnit(); }}
                placeholder="Nhập mã mới, VD: SX4-09"
                aria-label="Mã căn mới"
              />
              <button type="button" onClick={addUnit}>＋ Thêm mã</button>
            </div>
            <div className={`sheet-sync-status is-${sheetStatus}`}>
              <span />
              {sheetStatus === "syncing" && "Đang đồng bộ Google Sheets…"}
              {sheetStatus === "synced" && `Tự động đồng bộ mỗi 60 giây${lastSheetSync ? ` · ${new Date(lastSheetSync).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}`}
              {sheetStatus === "error" && "Mất kết nối Sheets · đang dùng dữ liệu gần nhất"}
              <button type="button" onClick={() => { void refreshFromSheet(true); }}>Đồng bộ ngay</button>
            </div>
            <p className="unit-manager-note">Tab VAL_VỊNH TIÊN 08.2026 là nguồn dữ liệu duy nhất. Mã đã khóa vẫn nhận số liệu mới từ Sheet; ảnh và vị trí chỉnh sửa được giữ nguyên.</p>
            <div className="unit-manager-actions">
              <span aria-live="polite">{unitMessage || `Đang chỉnh mã ${content.unitCode}`}</span>
              <div>
                <button className={`unit-lock-button ${isActiveUnitLocked ? "is-locked" : ""}`} type="button" onClick={toggleActiveUnitLock}>{isActiveUnitLocked ? "🔒 Mở khóa" : "🔓 Khóa mã này"}</button>
                <button type="button" onClick={deleteActiveUnit} disabled={units.length <= 1 || isActiveUnitLocked}>Xóa mã này</button>
              </div>
            </div>
          </section>

          <div className="editor-intro">
            <span className="section-kicker">THIẾT KẾ NỘI DUNG</span>
            <h1>Thông tin căn</h1>
            <p>Thay đổi nội dung bên dưới, poster sẽ cập nhật ngay lập tức.</p>
            <div className={`autosave-status is-${saveStatus}`} aria-live="polite">
              <span />
              {saveStatus === "loading" && "Đang khôi phục bản gần nhất…"}
              {saveStatus === "saving" && "Đang tự động lưu…"}
              {saveStatus === "saved" && (canEdit?"Đã tự động lưu bản mới nhất":"Chế độ chỉ xem")}
              {saveStatus === "error" && "Chưa thể lưu — vui lòng thử lại"}
            </div>
          </div>

          <div className="field-list">
            {fieldGroups.map((field) => (
              <label className="field-control" key={field.key}>
                <span>{field.label}</span>
                <div className="input-wrap">
                  <input value={content[field.key]} onChange={(event) => updateField(field.key, event.target.value)} aria-label={field.label} />
                  {field.suffix && <b>{field.suffix}</b>}
                </div>
              </label>
            ))}
          </div>

          <div className="image-guide">
            <span className="guide-icon">✥</span>
            <div><strong>Kéo · zoom · đặt chỉ căn</strong><p>Hai ảnh lớn có thể kéo và thu phóng. Chỉ căn vàng–đỏ kéo tự do; dùng nút − / + trên chỉ căn để thu nhỏ hoặc phóng to.</p></div>
          </div>
          <div className="perspective-editor">
            <div className="perspective-editor-head">
              <span>ẢNH SỐ 1</span>
              <strong>Chọn phối cảnh thay thế</strong>
              <small>Bấm vào từng ảnh để thay ngay ảnh lớn trên cùng.</small>
            </div>
            <div className="perspective-picker" aria-label="Danh sách ảnh thay cho Ảnh số 1">
              {perspectives.map((item) => {
                const selected = images.main.src === item.src;
                return (
                  <div className={`perspective-option-wrap ${selected ? "is-selected" : ""}`} key={item.id}>
                    <button
                      className="perspective-option"
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectPerspective(item)}
                    >
                      <img src={sourceImage(item.src,480)} alt="" draggable={false} loading="lazy" />
                      <span title={item.name}>{item.name}</span>
                      {selected && <b>ĐANG CHỌN</b>}
                    </button>
                    {item.uploaded && (
                      <button className="perspective-option-remove" type="button" onClick={() => removePerspective(item.id)} aria-label={`Xóa ${item.name}`}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="perspective-add" type="button" onClick={() => perspectiveInputRef.current?.click()}>＋ Tải thêm nhiều phối cảnh</button>
            <input
              ref={perspectiveInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addPerspectives(event.target.files);
                event.target.value = "";
              }}
            />
          </div>
          <div className="perspective-editor gallery-perspective-editor">
            <div className="perspective-editor-head">
              <span>3 ẢNH NHỎ BÊN CẠNH</span>
              <strong>Phối cảnh nhà liền kề</strong>
              <small>Chọn vị trí ảnh, sau đó bấm phối cảnh muốn thay. Tên ảnh được giữ nguyên để dễ nhận biết.</small>
            </div>
            <div className="gallery-slot-tabs" role="tablist" aria-label="Chọn khung ảnh nhỏ cần thay">
              {gallerySlots.map((slot) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeGallerySlot === slot.key}
                  className={activeGallerySlot === slot.key ? "is-active" : ""}
                  key={slot.key}
                  onClick={() => setActiveGallerySlot(slot.key)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <div className="active-gallery-name">
              Đang chỉnh: <strong>{gallerySlots.find((slot) => slot.key === activeGallerySlot)?.label}</strong>
            </div>
            <div className="perspective-picker gallery-perspective-picker" aria-label="Danh sách phối cảnh nhà liền kề">
              {galleryPerspectives.map((item) => {
                const selected = images[activeGallerySlot].src === item.src;
                return (
                  <div className={`perspective-option-wrap ${selected ? "is-selected" : ""}`} key={item.id}>
                    <button
                      className="perspective-option"
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectGalleryPerspective(item)}
                    >
                      <img src={sourceImage(item.src,480)} alt="" draggable={false} loading="lazy" />
                      <span title={item.name}>{item.name}</span>
                      {selected && <b>ĐANG CHỌN</b>}
                    </button>
                    {item.uploaded && (
                      <button className="perspective-option-remove" type="button" onClick={() => removeGalleryPerspective(item.id)} aria-label={`Xóa ${item.name}`}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="perspective-add" type="button" onClick={() => galleryPerspectiveInputRef.current?.click()}>＋ Tải thêm nhiều ảnh liền kề</button>
            <input
              ref={galleryPerspectiveInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addGalleryPerspectives(event.target.files);
                event.target.value = "";
              }}
            />
          </div>
          <div className="perspective-editor villa-perspective-editor">
            <div className="perspective-editor-head">
              <span>3 ẢNH NHỎ BÊN CẠNH</span>
              <strong>Phối cảnh biệt thự</strong>
              <small>Chọn vị trí ảnh, sau đó bấm phối cảnh song lập hoặc đơn lập muốn thay. Tên ảnh gốc luôn được giữ để dễ nhận biết.</small>
            </div>
            <div className="gallery-slot-tabs" role="tablist" aria-label="Chọn khung ảnh nhỏ cho phối cảnh biệt thự">
              {gallerySlots.map((slot) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeVillaGallerySlot === slot.key}
                  className={activeVillaGallerySlot === slot.key ? "is-active" : ""}
                  key={slot.key}
                  onClick={() => setActiveVillaGallerySlot(slot.key)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <div className="active-gallery-name">
              Đang chỉnh: <strong>{gallerySlots.find((slot) => slot.key === activeVillaGallerySlot)?.label}</strong>
            </div>
            <div className="perspective-picker villa-perspective-picker" aria-label="Danh sách phối cảnh biệt thự">
              {villaPerspectives.map((item) => {
                const selected = images[activeVillaGallerySlot].src === item.src;
                return (
                  <div className={`perspective-option-wrap ${selected ? "is-selected" : ""}`} key={item.id}>
                    <button
                      className="perspective-option"
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectVillaPerspective(item)}
                    >
                      <img src={sourceImage(item.src,480)} alt="" draggable={false} loading="lazy" />
                      <span title={item.name}>{item.name}</span>
                      {selected && <b>ĐANG CHỌN</b>}
                    </button>
                    {item.uploaded && (
                      <button className="perspective-option-remove" type="button" onClick={() => removeVillaPerspective(item.id)} aria-label={`Xóa ${item.name}`}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="perspective-add" type="button" onClick={() => villaPerspectiveInputRef.current?.click()}>＋ Tải thêm nhiều ảnh biệt thự</button>
            <input
              ref={villaPerspectiveInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addVillaPerspectives(event.target.files);
                event.target.value = "";
              }}
            />
          </div>
          <div className="perspective-editor amenity-perspective-editor">
            <div className="perspective-editor-head">
              <span>3 ẢNH NHỎ BÊN CẠNH</span>
              <strong>Phối cảnh tiện ích</strong>
              <small>Chọn vị trí ảnh, sau đó bấm phối cảnh tiện ích muốn thay. Tên ảnh luôn được giữ để dễ nhận biết.</small>
            </div>
            <div className="gallery-slot-tabs" role="tablist" aria-label="Chọn khung ảnh nhỏ cho phối cảnh tiện ích">
              {gallerySlots.map((slot) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeAmenityGallerySlot === slot.key}
                  className={activeAmenityGallerySlot === slot.key ? "is-active" : ""}
                  key={slot.key}
                  onClick={() => setActiveAmenityGallerySlot(slot.key)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <div className="active-gallery-name">
              Đang chỉnh: <strong>{gallerySlots.find((slot) => slot.key === activeAmenityGallerySlot)?.label}</strong>
            </div>
            <div className="perspective-picker amenity-perspective-picker" aria-label="Danh sách phối cảnh tiện ích">
              {amenityPerspectives.map((item) => {
                const selected = images[activeAmenityGallerySlot].src === item.src;
                return (
                  <div className={`perspective-option-wrap ${selected ? "is-selected" : ""}`} key={item.id}>
                    <button
                      className="perspective-option"
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectAmenityPerspective(item)}
                    >
                      <img src={sourceImage(item.src,480)} alt="" draggable={false} loading="lazy" />
                      <span title={item.name}>{item.name}</span>
                      {selected && <b>ĐANG CHỌN</b>}
                    </button>
                    {item.uploaded && (
                      <button className="perspective-option-remove" type="button" onClick={() => removeAmenityPerspective(item.id)} aria-label={`Xóa ${item.name}`}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="perspective-add" type="button" onClick={() => amenityPerspectiveInputRef.current?.click()}>＋ Tải thêm nhiều ảnh tiện ích</button>
            <input
              ref={amenityPerspectiveInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addAmenityPerspectives(event.target.files);
                event.target.value = "";
              }}
            />
          </div>
          <button className="reset-button" type="button" onClick={resetTemplate}>↺ Đặt lại mẫu của mã đang chọn</button>
        </aside>

        <section className={`workspace ${isActiveUnitLocked ? "is-unit-locked" : ""}`} aria-label="Poster xem trước">
          <div className="workspace-heading">
            <div><span className="section-kicker">XEM TRƯỚC TRỰC TIẾP</span><h2>Bảng thông tin sản phẩm</h2></div>
            <div className="workspace-heading-actions">
              <span className="format-badge">DỌC · CAO CẤP</span>
              <button className="pricing-view-button" type="button" onClick={() => setPricingOpen(true)}>Xem phiếu tính giá</button>
            </div>
          </div>

          <div className="poster" id="property-poster">
            <div className="poster-glow" />
            {isActiveUnitLocked && <div className="poster-lock-notice" role="status"><span>🔒</span><strong>Đã khoá mã {content.unitCode}</strong><small>Mở khoá để chỉnh sửa hình ảnh và chỉ căn</small></div>}
            <section className="poster-head">
              <div className="project-lockup">
                <img className="brand-logo" src="/api/vinh-tien/brand-logo.png" alt="Vinhomes Green Paradise" />
              </div>

              <div className="property-data">
                <div className="unit-heading">
                  {content.unitTitle.trim().toLocaleLowerCase("vi") === "mã căn"
                    ? <img className="unit-title-image" src="/api/vinh-tien/unit-title.png" alt="Mã Căn" />
                    : <em>{content.unitTitle}</em>}
                  <strong>{content.unitCode}</strong>
                </div>
                <div className="spec-grid">
                  <div className="spec-row"><span>Diện tích đất:</span><strong>{content.landArea} <small>m²</small></strong></div>
                  <div className="spec-row"><span>Loại hình:</span><strong>{content.productType}</strong></div>
                  <div className="spec-row"><span>Diện tích xây dựng:</span><strong>{content.builtArea} <small>m²</small></strong></div>
                  <div className="spec-row"><span>Tiêu chuẩn BG:</span><strong>{content.handover}</strong></div>
                </div>
                <div className="price-row">
                  <div><span>GIÁ BÁN:</span><small>(Giá chưa gồm VAT + KPBT)</small></div>
                  <strong>{content.price} <b>{content.priceUnit.toLocaleUpperCase("vi")}</b></strong>
                </div>
              </div>
            </section>

            <section className="poster-main-image" inert={isActiveUnitLocked ? true : undefined}>
              <DraggableImage
                slot={images.main}
                label="Ảnh phối cảnh chính"
                enableZoom
                onMove={(x, y) => updateImage("main", { x, y })}
                onZoom={(zoom) => updateImage("main", { zoom })}
                onUpload={(file) => replaceImageWithUpload("main", file)}
              />
              <DraggableMarker
                position={mainMarker}
                unitCode={content.unitCode}
                onMove={(x, y) => setMainMarker((current) => ({ ...current, x, y }))}
                onScale={(scale) => setMainMarker((current) => ({ ...current, scale }))}
              />
            </section>

            <div className="poster-lower-grid" inert={isActiveUnitLocked ? true : undefined}>
              <section className="poster-map-section">
                <DraggableImage
                  className="map-image"
                  slot={images.map}
                  label="Ảnh mặt bằng tổng thể"
                  enableZoom
                  preserveQuality
                  onMove={(x, y) => updateImage("map", { x, y })}
                  onZoom={(zoom) => updateImage("map", { zoom })}
                  onUpload={(file) => replaceImageWithUpload("map", file)}
                />
                <DraggableMarker
                  position={mapMarker}
                  unitCode={content.unitCode}
                  onMove={(x, y) => setMapMarker((current) => ({ ...current, x, y }))}
                  onScale={(scale) => setMapMarker((current) => ({ ...current, scale }))}
                />
              </section>

              <section className="poster-gallery">
                <DraggableImage className="gallery-frame" slot={images.gallery1} label="Ảnh phối cảnh nhỏ 1" onMove={(x, y) => updateImage("gallery1", { x, y })} onUpload={(file) => replaceImageWithUpload("gallery1", file)} />
                <DraggableImage className="gallery-frame" slot={images.gallery2} label="Ảnh phối cảnh nhỏ 2" onMove={(x, y) => updateImage("gallery2", { x, y })} onUpload={(file) => replaceImageWithUpload("gallery2", file)} />
                <DraggableImage className="gallery-frame" slot={images.gallery3} label="Ảnh phối cảnh nhỏ 3" onMove={(x, y) => updateImage("gallery3", { x, y })} onUpload={(file) => replaceImageWithUpload("gallery3", file)} />
              </section>
            </div>
          </div>
          <div className="workspace-actions">
            <section className="export-panel" aria-label="Tùy chọn tải ảnh">
              <div className="export-mode-tabs" role="tablist" aria-label="Chọn cách tải">
                <button
                  type="button"
                  role="tab"
                  aria-selected={exportMode === "single"}
                  className={exportMode === "single" ? "is-active" : ""}
                  onClick={() => setExportMode("single")}
                >Tải 1 mã căn</button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={exportMode === "multiple"}
                  className={exportMode === "multiple" ? "is-active" : ""}
                  onClick={() => {
                    setExportMode("multiple");
                    if (!selectedExportUnitIds.length) setSelectedExportUnitIds(units.map((unit) => unit.id));
                  }}
                >Tải nhiều mã cùng lúc</button>
              </div>
              {exportMode === "single" ? (
                <p className="single-export-summary">Sẽ tải mã đang chọn: <strong>{content.unitCode}</strong></p>
              ) : (
                <div className="batch-unit-picker">
                  <div className="batch-picker-head">
                    <span>Chọn các mã cần xuất ({selectedExportUnitIds.length}/{units.length})</span>
                    <div>
                      <button type="button" onClick={() => setSelectedExportUnitIds(units.map((unit) => unit.id))}>Chọn tất cả</button>
                      <button type="button" onClick={() => setSelectedExportUnitIds([])}>Bỏ chọn</button>
                    </div>
                  </div>
                  <div className="batch-unit-list">
                    {units.map((unit) => {
                      const checked = selectedExportUnitIds.includes(unit.id);
                      return (
                        <label className={checked ? "is-checked" : ""} key={unit.id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setSelectedExportUnitIds((current) => checked
                              ? current.filter((id) => id !== unit.id)
                              : [...current, unit.id])}
                          />
                          <span>{unit.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p>Mỗi mã là một ảnh JPEG riêng; tất cả được đóng trong một tệp ZIP để tải một lần.</p>
                </div>
              )}
            </section>
            <button className="export-button poster-export-button" type="button" onClick={exportJpeg} disabled={exporting}>
              <span>{exporting ? "◌" : "↓"}</span>
              {exporting
                ? "Đang tạo và tải…"
                : exportMode === "single"
                  ? `Tải ảnh mã ${content.unitCode}`
                  : `Tải ${selectedExportUnitIds.length} mã căn (.ZIP)`}
            </button>
            {pendingMobileImage && (
              <div className="mobile-save-panel" role="status">
                <div>
                  <strong>Ảnh đã sẵn sàng</strong>
                  <span>{pendingMobileImage.filename} · {pendingMobileImage.width} × {pendingMobileImage.height}px</span>
                </div>
                <button type="button" onClick={saveImageToPhone}>Lưu vào thư viện ảnh</button>
                <small>iPhone: chọn “Lưu hình ảnh” · Android: chọn Ảnh hoặc Google Photos</small>
              </div>
            )}
            <p className="export-message poster-export-message" aria-live="polite">{exportMessage}</p>
            <p className="workspace-note">Hai ảnh lớn hỗ trợ zoom 100–400%, kéo ngang/dọc và chỉ căn độc lập. Tệp tải về tự mang tên mã căn đang chọn: <strong>{content.unitCode.trim() || "ma-can"}-bang-thong-tin.jpg</strong>.</p>
          </div>
        </section>
      </div>
      {pricingOpen && activeUnit && (
        <div className="pricing-modal" role="dialog" aria-modal="true" aria-label={`Phiếu tính giá mã ${content.unitCode}`}>
          <button className="pricing-modal-backdrop" type="button" onClick={() => setPricingOpen(false)} aria-label="Đóng phiếu tính giá" />
          <section className="pricing-modal-panel">
            <header className="pricing-modal-toolbar">
              <div><span>VINHOMES GREEN PARADISE</span><strong>Phiếu tính giá · {content.unitCode}</strong></div>
              <div>
                <button className="pricing-print-button" type="button" onClick={() => window.print()}>In / Lưu PDF</button>
                <button className="pricing-download-button" type="button" onClick={exportPricingImage} disabled={exporting}>{exporting ? "Đang tạo ảnh…" : "Tải 1 ảnh hoàn chỉnh"}</button>
                <button className="pricing-close-button" type="button" onClick={() => setPricingOpen(false)} aria-label="Đóng">×</button>
              </div>
            </header>
            <section className="pricing-modal-hero">
              <div><span>VINHOMES GREEN PARADISE</span><h2>Bảng tính giá & tiến độ thanh toán</h2><p>Chọn mã căn để tự động nạp đúng hình ảnh, diện tích và giá bán từ Google Sheets gốc.</p></div>
              <aside><small>PHƯƠNG ÁN ĐANG TÍNH</small><strong>{pricingPlans.find((item) => item.id === pricingPlan)?.title}</strong></aside>
            </section>
            <div className="pricing-preview-scroll pricing-workspace">
              <aside className="pricing-controls-panel">
                <div className="pricing-control-head"><span>01</span><div><h3>Nhập thông tin</h3><p>Điều chỉnh thông tin để cập nhật phiếu.</p></div></div>
                <div className="pricing-form-group">
                  <label>Khách hàng<input value={pricingCustomer} onChange={(event) => setPricingCustomer(event.target.value)} /></label>
                  <label>Ngày lập phiếu<input type="date" value={pricingDate} onChange={(event) => setPricingDate(event.target.value)} /></label>
                </div>
                <h4>Sản phẩm</h4>
                <label className="pricing-field">Mã căn<select value={activeUnitId} onChange={(event) => selectUnit(event.target.value)}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
                <div className="pricing-source-card"><span>✓</span><div><strong>Đã đối chiếu file nguồn</strong><small>Google Sheets · dòng mã {content.unitCode}</small></div></div>
                <div className="pricing-form-group">
                  <label>Giá bán chưa VAT<input readOnly value={parseMoneyValue(activeUnit.pricing?.priceBeforeVat).toLocaleString("vi-VN")} /></label>
                  <label>Phí bảo trì<input readOnly value={parseMoneyValue(activeUnit.pricing?.maintenanceFee).toLocaleString("vi-VN")} /></label>
                </div>
                <h4>Phương thức thanh toán</h4>
                <div className="pricing-plan-buttons">{pricingPlans.map((item) => <button className={pricingPlan === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setPricingPlan(item.id)}><strong>{item.short}</strong><small>{item.note}</small></button>)}</div>
                <h4>Chính sách ưu đãi</h4>
                <div className="pricing-policy-selects">
                  <label>Hạng VinClub<select value={pricingVinClub} onChange={(event) => setPricingVinClub(event.target.value as VinClubTier)}><option value="none">Không</option><option value="gold">Gold · 0,15%</option><option value="platinum">Platinum · 0,20%</option><option value="diamond">Diamond · 0,25%</option></select></label>
                  <label>Quà sinh nhật<select value={pricingBirthday} onChange={(event) => setPricingBirthday(event.target.value as BirthdayTier)}><option value="none">Không</option><option value="member">Member · 0,30%</option><option value="gold">Gold · 0,90%</option><option value="platinum">Platinum · 1,20%</option><option value="diamond">Diamond · 1,50%</option></select></label>
                </div>
                <div className="pricing-policy-toggles">
                  <label><span><strong>Không nhận bảo lãnh NH</strong><small>Chiết khấu dự kiến 0,5%</small></span><input type="checkbox" checked={pricingNoBankGuarantee} onChange={(event) => setPricingNoBankGuarantee(event.target.checked)} /></label>
                  <label><span><strong>Lì xì may mắn</strong><small>33.000.000 ₫ trước VAT</small></span><input type="checkbox" checked={pricingLuckyMoney} onChange={(event) => setPricingLuckyMoney(event.target.checked)} /></label>
                  <label><span><strong>Quà tặng Aquafield</strong><small>20.000.000 ₫ · ngoài giá</small></span><input type="checkbox" checked={pricingAquafield} onChange={(event) => setPricingAquafield(event.target.checked)} /></label>
                </div>
                <p className="pricing-control-note">Các giá trị gốc lấy trực tiếp từ Sheet. Phương án ưu đãi chỉ dùng để lập bảng tham khảo cho khách hàng.</p>
              </aside>
              <div className="pricing-combined-preview" id="product-pricing-export">
                <BatchExportPoster posterId="pricing-product-poster" state={buildCurrentSnapshot()} />
                <PricingQuote unit={{ ...activeUnit, state: buildCurrentSnapshot() }} customer={pricingCustomer} quoteDate={pricingDate} plan={pricingPlan} vinClub={pricingVinClub} birthday={pricingBirthday} noBankGuarantee={pricingNoBankGuarantee} luckyMoney={pricingLuckyMoney} aquafield={pricingAquafield} />
              </div>
            </div>
            <p className="pricing-source-note">Phiếu tự lấy đúng dòng của mã căn từ Google Sheets gốc và cập nhật theo chu kỳ đồng bộ hiện tại.</p>
            {pendingMobileImage && (
              <div className="mobile-save-panel" role="status">
                <div><strong>Ảnh đã sẵn sàng</strong><span>{pendingMobileImage.filename}</span></div>
                <button type="button" onClick={saveImageToPhone}>Lưu vào thư viện ảnh</button>
              </div>
            )}
            <p className="export-message" aria-live="polite">{exportMessage}</p>
          </section>
        </div>
      )}
      {exporting && exportMode === "multiple" && (
        <div className="batch-export-stage" aria-hidden="true">
          {units
            .filter((unit) => selectedExportUnitIds.includes(unit.id))
            .map((unit) => <BatchExportPoster key={unit.id} posterId={`batch-poster-${unit.id}`} state={unit.state} />)}
        </div>
      )}
    </main>
  );
}
