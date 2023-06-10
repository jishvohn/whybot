import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import classNames from "classnames";
import { Fragment } from "react";

interface DropdownOption {
  value: string;
  name: string;
  popup?: string;
}

function Dropdown(props: {
  className?: string;
  value: string;
  options: DropdownOption[];
  onChange(value: string): void;
}) {
  return (
    <Listbox value={props.value} onChange={props.onChange}>
      {({ open }) => (
        <div
          className={classNames(
            "relative bg-zinc-600 rounded-md",
            props.className
          )}
        >
          <Listbox.Button className="relative w-full cursor-pointer rounded-md py-2 pl-3 pr-10 text-left shadow-sm text-sm border border-white/30 hover:border-white/40">
            <span className="block truncate">
              {props.options.find((o) => o.value === props.value)?.name}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-40 mt-1 max-h-60 w-full rounded-md bg-zinc-700 border border-white/30 py-1 shadow-lg text-sm">
              {props.options.map((opt) => (
                <Listbox.Option
                  key={opt.value}
                  className={({ active }) =>
                    classNames(
                      "relative cursor-pointer select-none py-2 pl-3 pr-9 group",
                      { "bg-zinc-600": active }
                    )
                  }
                  value={opt.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={classNames(
                          selected ? "font-semibold" : "font-normal",
                          "block truncate"
                        )}
                      >
                        {opt.name}
                      </span>

                      {selected ? (
                        <span
                          className={classNames(
                            "absolute inset-y-0 right-0 flex items-center pr-2"
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                      {opt.popup && (
                        <div className="group-hover:visible invisible absolute left-full ml-2 top-0 shrink-0 w-40">
                          <div className="inline-block bg-zinc-800/50 rounded p-2 py-1 border border-white/20 text-white/90">
                            {opt.popup}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}

export default Dropdown;
