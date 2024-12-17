import { Context, Devvit } from "@devvit/public-api";

export const MainMenu = (props: any, _context: Context): JSX.Element => {
  return (
    <vstack gap="large">
      <text
        style="heading"
        size="xxlarge"
        weight="bold"
        alignment="center"
        color="neutral-content"
      >
        WordSeeker
      </text>
      <button
        appearance="primary"
        icon="play"
        onPress={() => props.setPage("play")}
      >
        Play
      </button>
      <button icon="topic-advice" onPress={() => props.setPage("howToPlay")}>
        How To Play
      </button>
      <button icon="contest" onPress={() => props.setPage("leaderboard")}>
        Leaderboard
      </button>
    </vstack>
  );
};
