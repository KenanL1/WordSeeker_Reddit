import {
  Context,
  Devvit,
  IconName,
  useAsync,
  useForm,
  useState,
} from "@devvit/public-api";
import { Board } from "./Board.js";
import { Service } from "../service/Service.js";

export const Play = (props: any, context: Context): JSX.Element => {
  const service = new Service(context);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const selectCard = (word: string) => {
    setSelectedWords([...selectedWords, word]);
    return true;
  };
  const deselectCard = (word: string) => {
    setSelectedWords(selectedWords.filter((w) => w !== word));
    return true;
  };
  const guessForm = useForm(
    {
      title: "Submit a clue",
      description: "Provide a word for players to guess the selected words",
      acceptLabel: "Submit",
      fields: [
        {
          type: "string",
          name: "guess",
          label: "Word",
          required: true,
        },
      ],
    },
    async (values) => {
      // console.log(values.guess);
      const currentSubreddit = await context.reddit.getCurrentSubreddit();
      const newPost = await context.reddit.submitPost({
        title: "Select the correct words",
        subredditName: currentSubreddit.name,
        preview: (
          <vstack>
            <text>Loading...</text>
          </vstack>
        ),
      });

      // Save post data to redis
      const postData = {
        guess: values.guess,
        amount: selectedWords.length,
        postType: "guessPost",
        words: words,
        selectedWords: selectedWords,
      };
      context.redis.set(`post:${newPost.id}`, JSON.stringify(postData));

      context.ui.showToast("Post submitted successfully!");
      props.onClose();
    }
  );

  const { data: words } = useAsync(async () => {
    const numCards = 25;
    var wordSet = new Set<string>();
    let dictionary = await service.getActiveDictionaries();
    let dictWords = dictionary[0].words;

    if (dictWords) {
      while (wordSet.size < numCards) {
        let word = dictWords[Math.floor(Math.random() * dictWords.length)];

        if (!wordSet.has(word)) {
          wordSet.add(word);
        }
      }
    }
    // return wordsSet;
    return [...wordSet];
  });

  if (!words)
    return (
      <vstack height="100%" width="100%" alignment="middle center">
        <text size="large">Loading ...</text>
      </vstack>
    );

  let boardText = "Leave a clue for others to guess";
  let fIcon: IconName = "controversial";
  let iconColor = "";

  return (
    <vstack>
      <Board
        selectCard={selectCard}
        deselectCard={deselectCard}
        words={words}
        guess={false}
      />
      ;
      <spacer size="medium" />
      <hstack width={"100%"} height={"2px"} backgroundColor={"gray"}></hstack>
      {/* <hstack width={"100%"} height={"5px"} /> */}
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
      {/* <hstack width={"100%"} height={"7px"} /> */}
      <hstack width={"100%"} height={"2px"} backgroundColor={"gray"} />
      <spacer size="medium" />
      <vstack>
        <button
          appearance="primary"
          onPress={() => {
            context.ui.showForm(guessForm);
          }}
        >
          Leave Clue
        </button>
      </vstack>
    </vstack>
  );
};
