import {
  Context,
  Devvit,
  useForm,
  useAsync,
  useState,
} from "@devvit/public-api";
import { MainMenu } from "../components/MainMenu.js";
import { Leaderboard } from "../components/Leaderboard.js";
import { HowToPlay } from "../components/HowToPlay.js";
import { Play } from "../components/Play.js";

export const CreateScreen = (props: any, context: Context): JSX.Element => {
  const isAuthor = true;

  type PageType = "menu" | "play" | "leaderboard" | "howToPlay";
  const [page, setPage] = useState<PageType>("menu");

  const onClose = (): void => {
    setPage("menu");
  };

  const pages: Record<PageType, JSX.Element> = {
    menu: <MainMenu setPage={setPage} />,
    play: <Play dictionary={props.dictionary} onClose={onClose} />,
    leaderboard: <Leaderboard onClose={onClose} username={props.username} />,
    howToPlay: <HowToPlay onClose={onClose} />,
  };

  return pages[page];
};
