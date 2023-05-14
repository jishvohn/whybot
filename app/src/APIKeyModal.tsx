import {
  Fragment,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";
import { openai_browser } from "./Flow";
import "./index.css";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Transition, Dialog } from "@headlessui/react";

export type ApiKey = {
  key: string;
  valid: boolean;
};

export function clearApiKeyLocalStorage() {
  localStorage.removeItem("apkls");
}

// base64 encode api key and set in localStorage
export function setApiKeyInLocalStorage(apiKey: string) {
  const encodedApiKey = btoa(apiKey);
  localStorage.setItem("apkls", encodedApiKey);
  console.log("set em");
}

// pull from localStorage and base64 decode
export function getApiKeyFromLocalStorage() {
  const encodedApiKey = localStorage.getItem("apkls");
  if (encodedApiKey != null) {
    console.log("got em");
    return { key: atob(encodedApiKey), valid: true };
  }
  return { key: "", valid: false };
}

type APIKeyModalProps = {
  open: boolean;
  onClose: () => void;
  apiKey: ApiKey;
  setApiKey: Dispatch<SetStateAction<ApiKey>>;
};

enum KeyStatus {
  Error = "error",
  Initial = "initial",
  Success = "success",
}

export function APIKeyModal({
  open,
  onClose,
  apiKey,
  setApiKey,
}: APIKeyModalProps) {
  const initialStatus = apiKey.valid ? KeyStatus.Success : KeyStatus.Initial;
  const [status, setStatus] = useState<string>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const validate = useCallback(
    async (key: string) => {
      setErrorMessage("");
      // preliminary validation
      let valid = false;
      if (key.length === 0) {
        setStatus(KeyStatus.Initial);
      } else if (!key.startsWith("sk-") || key.length !== 51) {
        setStatus(KeyStatus.Error);
      } else {
        // actual validation by pinging OpenAI's API
        try {
          await openai_browser("2+2=", {
            apiKey: key,
            temperature: 1,
            model: "gpt-3.5-turbo",
            onChunk: () => {
              setStatus(KeyStatus.Success);
              valid = true;
              setApiKeyInLocalStorage(key);
            },
          });
        } catch (error: any) {
          console.error(error);
          setErrorMessage(error);
          setStatus(KeyStatus.Error);
        }
      }
      setApiKey({ key, valid });
    },
    [apiKey]
  );

  // Error styling
  const errorStyling = useMemo(() => {
    switch (status) {
      case KeyStatus.Error:
        return "border border-red-400/70 focus:border-red-400";
      case KeyStatus.Success:
        return "border border-green-400/70";
      default:
        return "border border-gray-400/70 focus:border-gray-400";
    }
  }, [status]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative max-w-[450px] transform overflow-hidden rounded-lg bg-gray-700 px-4 pb-4 text-left shadow-xl transition-all sm:my-8 sm:p-6">
                <div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-100">API key</p>
                  </div>
                </div>
                <input
                  type="password"
                  spellCheck={false}
                  autoFocus
                  className={`sm:mt-4 w-full px-2 py-1 bg-transparent ${errorStyling} text-xs text-white rounded-md outline-none grow`}
                  value={apiKey.key}
                  onChange={async (e) => {
                    // If the key was originally valid, the current edit will be invalid which means we clear localStorage.
                    setApiKey({ key: e.target.value, valid: false });
                    if (status === KeyStatus.Success) {
                      clearApiKeyLocalStorage();
                    }
                    await validate(e.target.value);
                  }}
                />
                {status === KeyStatus.Error && (
                  <>
                    <div className="mt-3 text-xs text-red-400 flex items-center space-x-[2px]">
                      <div>
                        <XMarkIcon className="w-4 h-4 stroke-red" />
                      </div>
                      <div>Invalid API key</div>
                    </div>
                    {errorMessage != "" && (
                      <div className="mt-1 text-xs text-red-400">
                        {errorMessage}
                      </div>
                    )}
                  </>
                )}
                {status === KeyStatus.Success && (
                  <div className="mt-3 text-xs text-green-400 flex items-center space-x-[2px]">
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-3 h-3 stroke-green"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div>Valid API key</div>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-400">
                  Your API key is sent directly to OpenAI from your browser; it
                  never touches our servers!
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type APIInfoModalProps = {
  open: boolean;
  onClose: () => void;
  setApiKeyModalOpen: () => void;
};
export function APIInfoModal({
  open,
  onClose,
  setApiKeyModalOpen,
}: APIInfoModalProps) {
  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-700 px-4 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                  <div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-100">
                        Running these prompts is expensive, so for now we’re
                        limiting everyone to 5 a day with GPT-3.5, plus one with
                        GPT-4. However, you can bypass the limit if you have
                        your own OpenAI API key!
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex outline-none rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white"
                      onClick={() => {
                        setApiKeyModalOpen();
                        onClose();
                      }}
                    >
                      Use my own API key
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
