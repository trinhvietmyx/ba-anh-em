import type { Dish } from '../shared/model.ts';

type MenuEntry = [id: string, name: string, price: number, file?: string];
type MenuGroup = [category: string, items: MenuEntry[]];

// Images are supplied by the user. Prices and availability are prototype data.
const groups: MenuGroup[] = [
  [
    'Món nướng',
    [
      ['ga-nuong-la-chanh', 'Gà nướng lá chanh', 329_000, 'ga.webp'],
      ['ba-chi-nuong-sa-te', 'Ba chỉ nướng sa tế', 149_000],
      ['bach-tuoc-nuong-chao', 'Bạch tuộc nướng chao', 179_000],
      ['bo-nuong-la-lot', 'Bò nướng lá lốt', 149_000],
      ['bo-nuong-tang-tieu-den', 'Bò nướng tảng tiêu đen', 249_000],
      ['ca-loc-nuong-trui', 'Cá lóc nướng trui', 219_000],
      ['muc-nuong-sa-te', 'Mực nướng sa tế', 179_000],
      ['nem-nuong-cuon', 'Nem nướng cuốn', 119_000],
      ['suon-bo-nuong-muoi-ot', 'Sườn bò nướng muối ớt', 259_000],
      ['suon-nuong', 'Sườn nướng', 219_000, 'suon.webp'],
      ['tom-nuong-muoi-ot', 'Tôm nướng muối ớt', 199_000],
    ],
  ],
  [
    'Lẩu',
    [
      ['lau-bo-sa-te', 'Lẩu bò sa tế', 389_000, 'lau.webp'],
      ['lau-ca-keo-la-giang', 'Lẩu cá kèo lá giang', 329_000],
      ['lau-ga-la-e', 'Lẩu gà lá é', 349_000],
      ['lau-nam', 'Lẩu nấm', 289_000],
      ['lau-rieu-cua-bap-bo', 'Lẩu riêu cua bắp bò', 389_000],
      ['lau-thai-hai-san', 'Lẩu Thái hải sản', 369_000],
    ],
  ],
  [
    'Khai vị',
    [
      ['bap-xao-bo-ruoc', 'Bắp xào bơ ruốc', 59_000],
      ['canh-ga-chien-mam', 'Cánh gà chiên mắm', 129_000],
      ['cha-gio-tom-thit', 'Chả giò tôm thịt', 99_000],
      ['dau-hu-chien-sa', 'Đậu hũ chiên sả', 69_000],
      ['goi-bo-bop-thau', 'Gỏi bò bóp thấu', 149_000],
      ['goi-ga-rau-ram', 'Gỏi gà rau răm', 119_000],
      ['goi-ngo-sen', 'Gỏi ngó sen', 119_000],
      ['khoai-lang-chien', 'Khoai lang chiên', 59_000],
    ],
  ],
  [
    'Món chính',
    [
      ['be-xao-nu-bi', 'Bê xào nụ bí', 159_000],
      ['bo-luc-lac', 'Bò lúc lắc', 179_000],
      ['bo-sot-tieu-xanh', 'Bò sốt tiêu xanh', 189_000],
      ['bo-xao-bong-thien-ly', 'Bò xào bông thiên lý', 159_000],
      ['ca-dieu-hong-chien-sa', 'Cá diêu hồng chiên sả', 189_000],
      ['ca-kho-to', 'Cá kho tộ', 139_000],
      ['ga-hap-hanh-gung', 'Gà hấp hành gừng', 289_000],
      ['muc-chien-mam', 'Mực chiên mắm', 169_000],
      ['muc-xao-chua-ngot', 'Mực xào chua ngọt', 169_000],
      ['suon-rim-mat-ong', 'Sườn rim mật ong', 169_000],
      ['thit-kho-trung', 'Thịt kho trứng', 119_000],
      ['tom-rang-me', 'Tôm rang me', 179_000],
      ['tom-xao-bo-toi', 'Tôm xào bơ tỏi', 189_000],
      ['vit-om-sau', 'Vịt om sấu', 269_000],
    ],
  ],
  [
    'Rau & món kèm',
    [
      ['bong-cai-xao-dau-hao', 'Bông cải xào dầu hào', 79_000],
      ['ca-tim-nuong-mo-hanh', 'Cà tím nướng mỡ hành', 69_000],
      ['dau-que-xao-toi', 'Đậu que xào tỏi', 69_000],
      ['mang-tay-xao-nam', 'Măng tây xào nấm', 89_000],
      ['nam-dui-ga-xao-sa-ot', 'Nấm đùi gà xào sả ớt', 89_000],
    ],
  ],
  [
    'Cơm, bún & mì',
    [
      ['bun-tuoi', 'Bún tươi', 19_000],
      ['com-chien-hai-san', 'Cơm chiên hải sản', 119_000],
      ['com-chien-toi', 'Cơm chiên tỏi', 79_000],
      ['com-trang', 'Cơm trắng', 19_000],
      ['mi-xao-bo', 'Mì xào bò', 119_000],
      ['mien-xao-cua', 'Miến xào cua', 149_000],
    ],
  ],
  [
    'Đồ uống',
    [
      ['chanh-day-da', 'Chanh dây đá', 39_000],
      ['dua-tuoi', 'Dừa tươi', 39_000],
      ['nuoc-mo', 'Nước mơ', 39_000],
      ['tra-dao-cam-sa', 'Trà đào cam sả', 49_000],
      ['tra-trai-cay', 'Trà trái cây', 45_000, 'tra.webp'],
    ],
  ],
  [
    'Tráng miệng',
    [
      ['che-khuc-bach', 'Chè khúc bạch', 45_000],
      ['sua-chua-nep-cam', 'Sữa chua nếp cẩm', 39_000],
      ['trai-cay-theo-mua', 'Trái cây theo mùa', 79_000],
    ],
  ],
];

export const IMPORTED_DISHES = groups.flatMap<Dish>(([category, items]) =>
  items.map(([id, name, price, file = `${id}.jpg`]) => ({
    id,
    name,
    category,
    price,
    description: '',
    image: `/images/menu/${file}`,
    available: true,
    published: true,
  })),
);
