import { LoaderIcon } from './icons';
import cn from 'classnames';

interface ImageEditorProps {
  title: string;
  content: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: string;
  isInline: boolean;
  dir?: 'rtl' | 'ltr';
  lang?: string;
}

export function ImageEditor({
  title,
  content,
  status,
  isInline,
  dir = 'ltr',
  lang,
}: ImageEditorProps) {
  return (
    <div
      className={cn('flex flex-row items-center justify-center w-full', {
        'h-[calc(100dvh-60px)]': !isInline,
        'h-[200px]': isInline,
        'rtl': dir === 'rtl',
      })}
      dir={dir}
      lang={lang}
    >
      {status === 'streaming' ? (
        <div className={cn("flex flex-row gap-4 items-center", {
          "flex-row-reverse": dir === 'rtl'
        })}>
          {!isInline && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
          <div>{dir === 'rtl' ? 'در حال ایجاد تصویر...' : 'Generating Image...'}</div>
        </div>
      ) : (
        <picture>
          <img
            className={cn('w-full h-fit max-w-[800px]', {
              'p-0 md:p-20': !isInline,
            })}
            src={`data:image/png;base64,${content}`}
            alt={title}
          />
        </picture>
      )}
    </div>
  );
}
