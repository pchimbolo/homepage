import { useRouter } from "next/router";
import { MdSettings } from "react-icons/md";

export default function ConfigEditorToggle() {
  const router = useRouter();

  return (
    <div id="config-editor" className="rounded-full flex align-middle self-center mr-3">
      <MdSettings
        onClick={() => router.push("/config-editor")}
        className="text-theme-800 dark:text-theme-200 w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
        title="Config Editor"
      />
    </div>
  );
}
