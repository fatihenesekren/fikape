// Kartlardan skor/spec tablolarına kadar sayfa boyunca AYNI sütun index'i AYNI
// zemin tonunu alsın diye tek bir kaynak — böylece göz sütunu her bölümde yeniden
// aramak yerine kesintisiz bir "şerit" olarak takip edebiliyor. İsim tekrarını
// azaltmanın (bkz. kullanıcı geri bildirimi + 5 uzman ajan denetimi) teknik
// karşılığı bu: metin yerine tutarlı bir görsel zemin sütun kimliğini taşıyor.
export function zebraColumnBg(index: number): string {
  return index % 2 === 0 ? "bg-white" : "bg-gray-50";
}
