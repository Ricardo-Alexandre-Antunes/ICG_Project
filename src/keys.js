// Modifier Keys
export const SHIFT = 16;
export const CTRL = 17;
export const ALT = 18;
export const CAPS_LOCK = 20;
export const ESC = 27;

// Navigation Keys
export const ARROWLEFT = 37;
export const ARROWUP = 38;
export const ARROWRIGHT = 39;
export const ARROWDOWN = 40;
export const PAGE_UP = 33;
export const PAGE_DOWN = 34;
export const HOME = 36;
export const END = 35;
export const INSERT = 45;
export const DELETE = 46;

// Function Keys
export const F1 = 112;
export const F2 = 113;
export const F3 = 114;
export const F4 = 115;
export const F5 = 116;
export const F6 = 117;
export const F7 = 118;
export const F8 = 119;
export const F9 = 120;
export const F10 = 121;
export const F11 = 122;
export const F12 = 123;

// Control Keys
export const BACKSPACE = 8;
export const TAB = 9;
export const ENTER = 13;
export const PAUSE = 19;
export const PRINT_SCREEN = 44;
export const NUM_LOCK = 144;
export const SCROLL_LOCK = 145;
export const SPACE = 32;

// Number Keys (Top Row)
export const DIGIT_0 = 48;
export const DIGIT_1 = 49;
export const DIGIT_2 = 50;
export const DIGIT_3 = 51;
export const DIGIT_4 = 52;
export const DIGIT_5 = 53;
export const DIGIT_6 = 54;
export const DIGIT_7 = 55;
export const DIGIT_8 = 56;
export const DIGIT_9 = 57;

// Letter Keys
export const A = 65;
export const B = 66;
export const C = 67;
export const D = 68;
export const E = 69;
export const F = 70;
export const G = 71;
export const H = 72;
export const I = 73;
export const J = 74;
export const K = 75;
export const L = 76;
export const M = 77;
export const N = 78;
export const O = 79;
export const P = 80;
export const Q = 81;
export const R = 82;
export const S = 83;
export const T = 84;
export const U = 85;
export const V = 86;
export const W = 87;
export const X = 88;
export const Y = 89;
export const Z = 90;

// Numpad Keys
export const NUMPAD_0 = 96;
export const NUMPAD_1 = 97;
export const NUMPAD_2 = 98;
export const NUMPAD_3 = 99;
export const NUMPAD_4 = 100;
export const NUMPAD_5 = 101;
export const NUMPAD_6 = 102;
export const NUMPAD_7 = 103;
export const NUMPAD_8 = 104;
export const NUMPAD_9 = 105;
export const NUMPAD_MULTIPLY = 106;
export const NUMPAD_ADD = 107;
export const NUMPAD_SUBTRACT = 109;
export const NUMPAD_DECIMAL = 110;
export const NUMPAD_DIVIDE = 111;

// Punctuation and Symbols
export const SEMICOLON = 186;
export const EQUAL = 187;
export const COMMA = 188;
export const DASH = 189;
export const PERIOD = 190;
export const FORWARD_SLASH = 191;
export const OPEN_BRACKET = 219;
export const BACK_SLASH = 220;
export const CLOSE_BRACKET = 221;
export const SINGLE_QUOTE = 222;
export const BACKTICK = 192;

export const codeToKey = {
    [SHIFT]: 'Shift',
    [CTRL]: 'Control',
    [ALT]: 'Alt',
    [CAPS_LOCK]: 'CapsLock',
    [ESC]: 'Escape',
    
    [ARROWLEFT]: 'ArrowLeft',
    [ARROWUP]: 'ArrowUp',
    [ARROWRIGHT]: 'ArrowRight',
    [ARROWDOWN]: 'ArrowDown',
    [PAGE_UP]: 'PageUp',
    [PAGE_DOWN]: 'PageDown',
    [HOME]: 'Home',
    [END]: 'End',
    [INSERT]: 'Insert',
    [DELETE]: 'Delete',
    
    [F1]: 'F1',
    [F2]: 'F2',
    [F3]: 'F3',
    [F4]: 'F4',
    [F5]: 'F5',
    [F6]: 'F6',
    [F7]: 'F7',
    [F8]: 'F8',
    [F9]: 'F9',
    [F10]: 'F10',
    [F11]: 'F11',
    [F12]: 'F12',
    
    [BACKSPACE]: 'Backspace',
    [TAB]: 'Tab',
    [ENTER]: 'Enter',
    [PAUSE]: 'Pause',
    [PRINT_SCREEN]: 'PrintScreen',
    [NUM_LOCK]: 'NumLock',
    [SCROLL_LOCK]: 'ScrollLock',
    [SPACE]: 'Space',
    
    // Top row numbers
    [DIGIT_0]: '0', 
    [DIGIT_1]: '1', 
    [DIGIT_2]: '2', 
    [DIGIT_3]: '3', 
    [DIGIT_4]: '4', 
    [DIGIT_5]: '5', 
    [DIGIT_6]: '6', 
    [DIGIT_7]: '7', 
    [DIGIT_8]: '8', 
    [DIGIT_9]: '9',
    
    // Letters
    [A]: 'A',
    [B]: 'B',
    [C]: 'C',
    [D]: 'D',
    [E]: 'E',
    [F]: 'F',
    [G]: 'G',
    [H]: 'H',
    [I]: 'I',
    [J]: 'J',
    [K]: 'K',
    [L]: 'L',
    [M]: 'M',
    [N]: 'N',
    [O]: 'O',
    [P]: 'P',
    [Q]: 'Q',
    [R]: 'R',
    [S]: 'S',
    [T]: 'T',
    [U]: 'U',
    [V]: 'V',
    [W]: 'W',
    [X]: 'X',
    [Y]: 'Y',
    [Z]: 'Z',

    // Numpad keys
    [NUMPAD_0]: 'Numpad0',
    [NUMPAD_1]: 'Numpad1',
    [NUMPAD_2]: 'Numpad2',
    [NUMPAD_3]: 'Numpad3',
    [NUMPAD_4]: 'Numpad4',
    [NUMPAD_5]: 'Numpad5',
    [NUMPAD_6]: 'Numpad6',
    [NUMPAD_7]: 'Numpad7',
    [NUMPAD_8]: 'Numpad8',
    [NUMPAD_9]: 'Numpad9',
    [NUMPAD_MULTIPLY]: 'NumpadMultiply',
    [NUMPAD_ADD]: 'NumpadAdd',
    [NUMPAD_SUBTRACT]: 'NumpadSubtract',
    [NUMPAD_DECIMAL]: 'NumpadDecimal',
    [NUMPAD_DIVIDE]: 'NumpadDivide',
    // Punctuation and symbols
    [SEMICOLON]: ';',
    [EQUAL]: '=',
    [COMMA]: ',',
    [DASH]: '-',
    [PERIOD]: '.',
    [FORWARD_SLASH]: '/',
    [OPEN_BRACKET]: '[',
    [BACK_SLASH]: '\\',
    [CLOSE_BRACKET]: ']',
    [SINGLE_QUOTE]: '\'',
    [BACKTICK]: '`',
};

