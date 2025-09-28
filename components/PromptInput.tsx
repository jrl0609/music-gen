
import React from 'react';
import { GenerateIcon, LoaderIcon } from './icons';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isLimitReached: boolean;
  error: string | null;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onGenerate, isLoading, isLimitReached, error }) => {
  const isDisabled = isLoading || isLimitReached;

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg h-full flex flex-col">
      <h2 className="text-2xl font-semibold mb-4 text-white">Create Your Sound</h2>
      <p className="text-gray-400 mb-6">
        Describe the instrumental music you want to create. Be as specific as you like!
      </p>
      <div className="flex-grow flex flex-col">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Lo-fi hip hop beat for studying, with soft piano and vinyl crackle..."
            className="w-full h-48 p-4 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
            disabled={isLoading}
          />
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm">
          {error}
        </div>
      )}
      <button
        onClick={onGenerate}
        disabled={isDisabled}
        className={`w-full mt-6 flex items-center justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white transition-all duration-200 ${
          isDisabled
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500'
        }`}
      >
        {isLoading ? (
          <>
            <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Generating...
          </>
        ) : (
          <>
            <GenerateIcon className="mr-3 h-6 w-6" />
            Generate Music
          </>
        )}
      </button>
    </div>
  );
};

export default PromptInput;
