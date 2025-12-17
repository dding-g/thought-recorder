/**
 * 카카오 i 오픈빌더 스킬 요청/응답 타입 정의
 * @see https://i.kakao.com/docs/skill-response-format
 */

// ============================================
// REQUEST TYPES
// ============================================

export interface KakaoSkillRequest {
  intent: KakaoIntent;
  userRequest: KakaoUserRequest;
  bot: KakaoBot;
  action?: KakaoAction;
}

export interface KakaoIntent {
  id: string;
  name: string;
}

export interface KakaoUserRequest {
  timezone: string;
  utterance: string;
  lang?: string;
  user: KakaoUser;
  callbackUrl?: string;
  params?: Record<string, string>;
  block?: {
    id: string;
    name: string;
  };
}

export interface KakaoUser {
  id: string;
  type: 'botUserKey' | 'appUserId';
  properties: {
    plusfriendUserKey?: string;
    appUserId?: string;
    isFriend?: boolean;
  };
}

export interface KakaoBot {
  id: string;
  name: string;
}

export interface KakaoAction {
  name: string;
  params: Record<string, string>;
  detailParams: Record<string, KakaoDetailParam>;
  clientExtra?: Record<string, unknown>;
}

export interface KakaoDetailParam {
  origin: string;
  value: string;
  groupName?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface KakaoSkillResponse {
  version: '2.0';
  template: KakaoTemplate;
  context?: KakaoContext;
  data?: Record<string, unknown>;
}

export interface KakaoTemplate {
  outputs: KakaoOutput[];
  quickReplies?: KakaoQuickReply[];
}

export interface KakaoContext {
  values: KakaoContextValue[];
}

export interface KakaoContextValue {
  name: string;
  lifeSpan: number;
  params?: Record<string, string>;
}

// Output Types
export type KakaoOutput =
  | KakaoSimpleText
  | KakaoSimpleImage
  | KakaoBasicCard
  | KakaoCommerceCard
  | KakaoListCard
  | KakaoItemCard
  | KakaoCarousel;

export interface KakaoSimpleText {
  simpleText: {
    text: string;
  };
}

export interface KakaoSimpleImage {
  simpleImage: {
    imageUrl: string;
    altText: string;
  };
}

export interface KakaoBasicCard {
  basicCard: {
    title?: string;
    description?: string;
    thumbnail?: KakaoThumbnail;
    profile?: KakaoProfile;
    social?: KakaoSocial;
    buttons?: KakaoButton[];
  };
}

export interface KakaoCommerceCard {
  commerceCard: {
    title: string;
    description?: string;
    price: number;
    discount?: number;
    discountRate?: number;
    discountedPrice?: number;
    currency?: string;
    thumbnails: KakaoThumbnail[];
    profile?: KakaoProfile;
    buttons?: KakaoButton[];
  };
}

export interface KakaoListCard {
  listCard: {
    header: KakaoListItem;
    items: KakaoListItem[];
    buttons?: KakaoButton[];
  };
}

export interface KakaoItemCard {
  itemCard: {
    thumbnail?: KakaoThumbnail;
    head?: KakaoItemHead;
    profile?: KakaoProfile;
    imageTitle?: KakaoImageTitle;
    itemList: KakaoItem[];
    itemListAlignment?: 'left' | 'right';
    itemListSummary?: KakaoItemSummary;
    title?: string;
    description?: string;
    buttons?: KakaoButton[];
    buttonLayout?: 'vertical' | 'horizontal';
  };
}

export interface KakaoCarousel {
  carousel: {
    type: 'basicCard' | 'commerceCard' | 'itemCard';
    items: (KakaoBasicCard | KakaoCommerceCard | KakaoItemCard)[];
    header?: KakaoCarouselHeader;
  };
}

// Component Types
export interface KakaoThumbnail {
  imageUrl: string;
  link?: KakaoLink;
  fixedRatio?: boolean;
  width?: number;
  height?: number;
}

export interface KakaoProfile {
  nickname: string;
  imageUrl?: string;
}

export interface KakaoSocial {
  like?: number;
  comment?: number;
  share?: number;
}

export interface KakaoButton {
  action: 'webLink' | 'message' | 'phone' | 'block' | 'share';
  label: string;
  webLinkUrl?: string;
  messageText?: string;
  phoneNumber?: string;
  blockId?: string;
  extra?: Record<string, unknown>;
}

export interface KakaoLink {
  web?: string;
  mobile?: string;
}

export interface KakaoListItem {
  title: string;
  description?: string;
  imageUrl?: string;
  link?: KakaoLink;
}

export interface KakaoItemHead {
  title: string;
}

export interface KakaoImageTitle {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface KakaoItem {
  title: string;
  description: string;
}

export interface KakaoItemSummary {
  title: string;
  description: string;
}

export interface KakaoCarouselHeader {
  title: string;
  description?: string;
  thumbnail?: KakaoThumbnail;
}

export interface KakaoQuickReply {
  label: string;
  action: 'message' | 'block';
  messageText?: string;
  blockId?: string;
  extra?: Record<string, unknown>;
}
