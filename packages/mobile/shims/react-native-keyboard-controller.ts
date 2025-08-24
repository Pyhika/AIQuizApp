// Minimal shim for react-native-keyboard-controller to avoid bundling errors on web/Expo Go
export const KeyboardProvider = ({ children }: { children: any }) => children as any;
export const useReanimatedKeyboardAnimation = () => ({
  height: { value: 0 },
  progress: { value: 0 },
});
export default {} as any;


