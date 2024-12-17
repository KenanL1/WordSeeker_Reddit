import {
  Context,
  Devvit,
  useForm,
  useAsync,
  useState,
  useInterval,
  IconName,
} from "@devvit/public-api";
import { Board } from "../components/Board.js";
import { Service } from "../service/Service.js";

export const GuessScreen = (props: any, context: Context): JSX.Element => {
  const service = new Service(context);
  const answer = new Set<string>(props.postData.selectedWords);

  const [wordsLeft, setWordsLeft] = useState<number>(props.postData.amount);
  const [attempted, setAttempted] = useState<boolean>(false);
  const [showStat, setShowStat] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  // Guess feedback
  const defaultFeedbackDur = 5;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackDuration, setFeedbackDuration] = useState(defaultFeedbackDur);

  const [reset, setReset] = useState<boolean>(false);

  const resetBoard = () => {
    setReset(true);
    setFailed(false);
    setWordsLeft(props.postData.amount);
    setAttempted(false);

    setFeedback(`Board Reset`);
    timer.start();
  };

  const timer = useInterval(() => {
    if (feedbackDuration > 1) {
      setFeedbackDuration(feedbackDuration - 1);
    } else {
      setFeedback(null);
      timer.stop();
      setFeedbackDuration(defaultFeedbackDur);
    }
  }, 100);

  const validateGuess = (word: string) => {
    let isCorrectGuess = answer.has(word);
    if (attempted == false) {
      setAttempted(true);
      // #number of attempts
      context.redis.incrBy(`attempt:${context.postId}`, 1);
    }
    if (isCorrectGuess) {
      setWordsLeft(wordsLeft - 1);
      setFeedback(`${wordsLeft - 1} words left`);
      if (wordsLeft - 1 == 0) {
        context.redis.zAdd(`completed:${context.postId}`, {
          member: props.username,
          score: Date.now(),
        });
        setCompleted(true);
        setFeedback("Well done!");

        if (props.username) service.incrementUserScore(props.username, 1);
        // #number of success
        context.redis.incrBy(`success:${context.postId}`, 1);
      }
      timer.start();
    } else {
      setFeedback(`Try again`);
      setFailed(true);
      timer.start();
    }
    return isCorrectGuess;
  };

  const { data: stats } = useAsync(async () => {
    const success =
      (await context.redis.get(`success:${context.postId}`)) || "0";
    const attempt =
      (await context.redis.get(`attempt:${context.postId}`)) || "0";

    return { success, attempt };
  });

  const [completed, setCompleted] = useState(async () => {
    return !!(await context.redis.zScore(
      `completed:${context.postId}`,
      props.username
    ));
  });

  if (!props.postData) {
    return (
      <vstack height="100%" width="100%" alignment="middle center">
        <text size="large">Loading ...</text>
      </vstack>
    );
  }

  let boardText = `Select the words that match the clue provided by ${props.username}`;
  let fIcon: IconName = "controversial";
  let iconColor = "";

  return (
    <zstack height="100%" width="100%" alignment="center middle">
      <vstack>
        <spacer size="medium" />
        <hstack width={"100%"} height={"2px"} backgroundColor={"gray"}></hstack>
        <hstack alignment="middle center">
          <text
            weight="bold"
            size="xlarge"
            color={completed ? "green" : "neutral-content"}
          >
            {completed ? "Completed:" : "Clue:"} {props.postData.guess}{" "}
            {props.postData.amount}{" "}
          </text>
        </hstack>
        <hstack width={"100%"} height={"2px"} backgroundColor={"gray"}></hstack>
        <Board
          words={props.postData.words}
          guess={true}
          selectCard={validateGuess}
          username={props.username}
          completed={completed}
          ans={answer}
          failed={failed}
          reset={reset}
          setReset={setReset}
        />
        <spacer size="medium" />
        <hstack width={"100%"} height={"2px"} backgroundColor={"gray"}></hstack>
        <vstack>
          <hstack
            alignment="middle center"
            gap="large"
            height={"20px"}
            width={"100%"}
          >
            <icon size="xsmall" color={iconColor} name={fIcon} />
            <text color="white" size="small">
              {boardText}
            </text>
            <icon size="xsmall" color={iconColor} name={fIcon} />
          </hstack>
          {!completed && (
            <text alignment="center" color="white" size="small" weight="bold">
              {failed ? "Try Again" : `${wordsLeft} words left`}
            </text>
          )}
        </vstack>
        <hstack width={"100%"} height={"2px"} backgroundColor={"gray"} />
        <spacer size="medium" />
        <hstack>
          <button icon="info" onPress={() => setShowStat(true)} />
          <button
            grow
            appearance="primary"
            disabled={!!completed}
            onPress={() => resetBoard()}
          >
            {"Retry"}
          </button>
        </hstack>
        <spacer size="medium" />
      </vstack>
      {/* Feedback */}
      {feedback != null && (
        <hstack
          alignment="middle center"
          backgroundColor="neutral-background	"
          borderColor="black"
          border="thick"
          padding="medium"
          cornerRadius="small"
        >
          <text size="medium" color="neutral-content">
            {feedback}
          </text>
        </hstack>
      )}
      {/* Post Stats */}
      {showStat == true && (
        <vstack
          padding="small"
          backgroundColor="neutral-background	"
          borderColor="black"
          border="thick"
          height="40%"
          width="60%"
          cornerRadius="medium"
        >
          <hstack width="100%" alignment="top">
            <spacer grow />
            <button icon="close" onPress={() => setShowStat(false)} />
          </hstack>
          <vstack alignment="center middle">
            <text size="large" weight="bold" color="neutral-content">
              {"Post Stats"}
            </text>
            <text size="medium" color="neutral-content">
              {`Total Attempts: ${stats?.attempt}`}
            </text>
            <text size="medium" color="neutral-content">
              {`Total Success: ${stats?.success}`}
            </text>
          </vstack>
        </vstack>
      )}
    </zstack>
  );
};
