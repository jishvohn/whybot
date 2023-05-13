import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

const PROFILES = [
  <div className="flex gap-4">
    <img className="w-20 h-20 object-cover rounded" src="john.png"></img>
    <div className="flex flex-col justify-between">
      <div>
        <div>John Qian</div>
        <div className="text-sm opacity-70">
          <a
            className="underline hover:text-white/90"
            href="https://www.adept.ai/"
          >
            Adept
          </a>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <a href="https://twitter.com/johnlqian">
          <img src="twitter.svg" className="h-4 hover:brightness-110" />
        </a>
        <a href="https://github.com/Xyzrr">
          <img
            src="github.svg"
            className="h-5 rounded-full invert hover:opacity-90"
          />
        </a>
      </div>
    </div>
  </div>,
  <div className="flex gap-4">
    <img className="w-20 h-20 object-cover rounded" src="vish.jpg"></img>
    <div className="flex flex-col justify-between">
      <div>
        <div>Vish Rajiv</div>
        <div className="text-sm opacity-70">
          <a
            className="underline hover:text-white/90"
            href="https://wandb.ai/site"
          >
            Weights & Biases
          </a>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <a href="https://twitter.com/vwrj3">
          <img src="twitter.svg" className="h-4 hover:brightness-110" />
        </a>
        <a href="https://github.com/vwrj">
          <img
            src="github.svg"
            className="h-5 rounded-full invert hover:opacity-90"
          />
        </a>
      </div>
    </div>
  </div>,
];

if (Math.random() < 0.5) {
  PROFILES.reverse();
}

function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-700 text-white p-4">
      <Link
        to="/"
        className="inline-block bg-black/40 rounded p-2 cursor-pointer hover:bg-black/60 backdrop-blur mb-4"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </Link>
      <div className="w-[450px] max-w-full space-y-8">
        <div className="mb-6 opacity-80">
          Whybot is a tool to deeply explore a question or topic. It started as
          a hackathon project, and still sort of is. Please let us know of any
          bugs you find or features you'd like. We both live in San Francisco,
          so let us know if you want to grab coffee!
        </div>
        {PROFILES}
      </div>
    </div>
  );
}

export default AboutPage;
