import { AltMenu } from "../AltMenu";
import { YeniAracForm } from "./YeniAracForm";

export const metadata = { title: "Yeni Araç — Katalog Yönetimi" };

export default function YeniAracPage() {
  return (
    <div className="px-4 sm:px-8 py-10 max-w-2xl">
      <AltMenu aktif="/admin/katalog/yeni" />
      <YeniAracForm />
    </div>
  );
}
