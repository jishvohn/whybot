import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import classNames from "classnames";
import { Fragment } from "react";

interface DropdownOption {
  value: string;
  name: string;
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
        <div className={classNames("relative", props.className)}>
          <Listbox.Button className="relative w-full cursor-pointer rounded-md py-1.5 pl-3 pr-10 text-left shadow-sm sm:text-sm sm:leading-6 border border-white/30 hover:border-white/40">
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
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-700 border border-white/30 py-1 shadow-lg sm:text-sm">
              {props.options.map((opt) => (
                <Listbox.Option
                  key={opt.value}
                  className={({ active }) =>
                    classNames(
                      "relative cursor-pointer select-none py-2 pl-3 pr-9",
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
