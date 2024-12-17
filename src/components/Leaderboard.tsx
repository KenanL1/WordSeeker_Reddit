import { Context, Devvit, useAsync } from "@devvit/public-api";
import { Service } from "../service/Service.js";

// export interface LeaderboardPageProps {
//   setPage: (page:Page ) => void;
//   openUserPage: (username: string) => void | Promise<void>;
//   leaderboard: Leaderboard;
//   currentUserName: string | undefined;
//   gameActive: boolean;
// }

export const LeaderboardRow = (props: any) => {
  const { rank, name, score, onPress, isCurrentUser } = props;
  const isDistinguished = rank <= 3;

  return (
    <hstack
      backgroundColor="rgba(255, 255, 255, 0.1)"
      cornerRadius="small"
      height="40px"
      width="100%"
      alignment="middle"
      onPress={onPress}
    >
      <spacer size="small" />
      <text color="rgba(255,255,255,0.7)" selectable={false}>{`${rank}.`}</text>
      <spacer size="xsmall" />
      <text
        weight="bold"
        color="white"
        grow
        overflow="ellipsis"
        selectable={false}
      >
        {`${name}${isCurrentUser ? " (you)" : ""}`}
      </text>
      <spacer size="small" />
      <text color="white" selectable={false}>
        {score}
      </text>
      <spacer size="small" />
      {isDistinguished && (
        <>
          <image
            url={`distinction-rank-${rank}.png`}
            imageHeight={48}
            imageWidth={48}
            width="24px"
            height="24px"
          />
          <spacer size="small" />
        </>
      )}
    </hstack>
  );
};

export const Leaderboard = (props: any, context: Context): JSX.Element => {
  const { username } = props;
  const service = new Service(context);
  const { data, loading } = useAsync<{
    leaderboard: any[];
    user: {
      rank: number;
      score: number;
    };
  }>(async () => {
    try {
      return {
        leaderboard: await service.getScores(10),
        user: await service.getUserScore(props.username),
      };
    } catch (error) {
      if (error) {
        console.error("Error loading leaderboard data", error);
      }
      return {
        leaderboard: [],
        user: { rank: -1, score: 0 },
      };
    }
  });
  const leaderboard = data?.leaderboard;
  const openUserPage = async (username: string) => {
    context.ui.navigateTo(`https://www.reddit.com/user/${username}/`);
  };

  return (
    <vstack
      width="100%"
      height="100%"
      alignment="center"
      padding="medium"
      gap="medium"
    >
      {/* Header */}
      <hstack width="100%" alignment="middle">
        <spacer width="40px" />
        <text
          color="white"
          weight="bold"
          size="xxlarge"
          overflow="ellipsis"
          grow
          alignment="center"
        >
          Leaderboard
        </text>
        <button icon="close" onPress={props.onClose} />
      </hstack>

      {/* Leaderboard */}
      <vstack gap="small" width="100%">
        {leaderboard?.map((user, index) => (
          <LeaderboardRow
            rank={index + 1}
            name={user.member}
            score={user.score}
            isCurrentUser={user.member === username}
            onPress={() => openUserPage(user.member)}
          />
        ))}
      </vstack>
    </vstack>
  );
};
