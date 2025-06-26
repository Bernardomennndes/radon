import { FilePond, FilePondProps, registerPlugin } from "react-filepond";
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

import "@repo/ui/styles/filepond.css";

registerPlugin(FilePondPluginFileValidateType);

function Upload({
  files,
  onUpdateFiles,
  ...props
}: {
  files?: File[];
  onUpdateFiles?: (files: File[]) => void;
} & FilePondProps) {
  return (
    <FilePond
      {...props}
      files={files}
      onupdatefiles={(files) =>
        onUpdateFiles?.(files.map((file) => file.file) as File[])
      }
      name="files"
      labelIdle='Solte arquivos aqui ou <span class="filepond--label-action">Navegue</span>'
      acceptedFileTypes={[
        "image/*",
        "video/*",
        "application/pdf",
      ]}
      credits={false}
    />
  );
}

export { Upload };
