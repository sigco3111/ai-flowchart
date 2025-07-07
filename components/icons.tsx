
import React from 'react';

export const StartEndIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="18" height="10" rx="5" className="fill-green-300" />
  </svg>
);

export const ProcessIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="18" height="10" rx="1" className="fill-blue-300" />
  </svg>
);

export const DecisionIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L21 12L12 21L3 12L12 3Z" className="fill-yellow-300" />
  </svg>
);

export const IoIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7H21L19 17H3L5 7Z" transform="skewX(-15)" className="fill-purple-300" />
  </svg>
);

export const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const MinusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const FitToScreenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12V6a2 2 0 0 1 2-2h6"></path>
        <path d="M12 20h6a2 2 0 0 0 2-2v-6"></path>
        <path d="M4 12H2"></path><path d="M12 4V2"></path>
        <path d="M20 12h2"></path><path d="M12 20v2"></path>
    </svg>
);

export const UndoIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

export const RedoIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 0 0 0 12h3" />
    </svg>
);

export const AutoLayoutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
    </svg>
);

export const LightbulbIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 14a4 4 0 0 1-4-4 4 4 0 0 1 3.2-3.9 4 4 0 0 1 4.8 3.9h0a4 4 0 0 1-4 4Z" />
        <path d="M12 2v2" />
        <path d="m4.9 4.9 1.4 1.4" />
        <path d="m17.7 4.9 1.4 1.4" />
        <path d="M22 12h-2" />
        <path d="M2 12h2" />
        <path d="m4.9 19.1 1.4-1.4" />
        <path d="m17.7 19.1 1.4-1.4" />
    </svg>
);

export const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);

export const ColorPickerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m15.7 15.7-3.4-3.4" />
      <path d="m12.3 8.3 3.4 3.4" />
      <path d="M12 2v20" />
      <path d="M22 12H2" />
      <path d="m16.9 7.1-1.2-1.2" />
      <path d="m8.3 12.3-3.2 3.2" />
      <path d="m7.1 7.1 1.2 1.2" />
      <path d="m15.7 8.3 3.2-3.2" />
    </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .53 1.437c.84.263 1.68.444 2.535.546V16a2.75 2.75 0 0 0 2.75 2.75h2.5A2.75 2.75 0 0 0 14 16V6.143c.855-.102 1.695-.283 2.535-.546a.75.75 0 1 0-.53-1.437c-.785-.248-1.57-.391-2.365-.468V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.67.126 2.5.352V16a1.25 1.25 0 0 1-1.25 1.25h-2.5A1.25 1.25 0 0 1 7.5 16V4.352C8.33.126 9.16 0 10 0z" transform="translate(0 1)" clipRule="evenodd" />
    </svg>
);

export const ArrowRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2 10a.75.75 0 0 1 .75-.75h12.59l-2.1-1.95a.75.75 0 1 1 1.02-1.1l3.5 3.25a.75.75 0 0 1 0 1.1l-3.5 3.25a.75.75 0 1 1-1.02-1.1l2.1-1.95H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
    </svg>
);

export const ArrowLeftRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M18 10a.75.75 0 0 1-.75.75H4.16l2.1 1.95a.75.75 0 1 1-1.02 1.1l-3.5-3.25a.75.75 0 0 1 0-1.1l3.5-3.25a.75.75 0 1 1 1.02 1.1l-2.1 1.95h13.09A.75.75 0 0 1 18 10Z" clipRule="evenodd" />
    </svg>
);

export const LineIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" />
    </svg>
);

export const SwitchArrowsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
);

export const SaveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
);

export const LoadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v8.614L6.295 10.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V4.75Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" transform="rotate(180 10 10)" />
    </svg>
);

export const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10 3a.75.75 0 0 1 .75.75v1.5h1.25a.75.75 0 0 1 0 1.5H10.75v1.25a.75.75 0 0 1-1.5 0V6.75H8a.75.75 0 0 1 0-1.5h1.25V3.75A.75.75 0 0 1 10 3ZM8.75 6a.75.75 0 0 0-1.5 0v1.5H6a.75.75 0 0 0 0 1.5h1.25v1.5a.75.75 0 0 0 1.5 0v-1.5H10a.75.75 0 0 0 0-1.5H8.75V6ZM10 12.25a.75.75 0 0 1 .75.75v1.5h1.25a.75.75 0 0 1 0 1.5H10.75v1.25a.75.75 0 0 1-1.5 0V16h-1.25a.75.75 0 0 1 0-1.5H9.25v-1.5A.75.75 0 0 1 10 12.25ZM13.75 6a.75.75 0 0 0-1.5 0v1.5h-1.25a.75.75 0 0 0 0 1.5h1.25v1.5a.75.75 0 0 0 1.5 0v-1.5H14a.75.75 0 0 0 0-1.5h-1.25V6Z" />
        <path fillRule="evenodd" d="M5.965 3.266a.75.75 0 0 1 .917-.521l8.035 2.5a.75.75 0 0 1 .521.917L13.333 15a.75.75 0 0 1-1.23.43l-2.22-3.684a.75.75 0 0 0-.916-.341l-3.334 1.25a.75.75 0 0 1-.916-.917l1.25-3.333a.75.75 0 0 0-.342-.917L3.266 6.717a.75.75 0 0 1-.521-.917l2.5-3.266Zm1.984 1.523L6.167 6.9l2.5 3.125a2.25 2.25 0 0 1 1.024 2.752l2.22 3.684 1.748-4.66-8-2.5Zm.293 4.293a.75.75 0 0 1 1.06 0l.94.94.94-.94a.75.75 0 1 1 1.06 1.06L11.06 12l.94.94a.75.75 0 1 1-1.06 1.06L10 13.06l-.94.94a.75.75 0 1 1-1.06-1.06L8.94 12l-.94-.94a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

export const EyeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.418-5.571a.812.812 0 0 1 1.07.026l1.249 1.562a.812.812 0 0 0 1.069.026l4.418-5.57a.812.812 0 0 1 1.07.026l4.418 5.57a.812.812 0 0 1 0 .638l-4.418 5.57a.812.812 0 0 1-1.07-.026l-1.249-1.562a.812.812 0 0 0-1.069-.026l-4.418 5.57a.812.812 0 0 1-1.07-.026L2.036 12.322Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const EyeOffIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L6.228 6.228" />
    </svg>
);
