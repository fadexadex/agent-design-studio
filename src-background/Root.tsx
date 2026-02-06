import { Composition } from "remotion";
import { BackgroundShowcase } from "./compositions/BackgroundShowcase";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BackgroundShowcase"
        component={BackgroundShowcase}
        durationInFrames={1080}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
