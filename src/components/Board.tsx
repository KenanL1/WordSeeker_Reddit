import {
  Context,
  Devvit,
  IconName,
  useAsync,
  useState,
} from "@devvit/public-api";

enum CardColor {
  Green = "green",
  Red = "red",
  Default = "gray",
}

const Card = ({
  defaultColor = CardColor.Default,
  guess = false,
  word,
  selectCard,
  deselectCard,
  completed,
  ans,
  reset,
  setReset,
}: {
  defaultColor?: CardColor;
  guess?: boolean;
  word: string;
  selectCard: (word: string) => boolean;
  deselectCard: (word: string) => boolean;
  completed?: boolean;
  ans?: any;
  reset?: boolean;
  setReset: (reset: boolean) => void;
}) => {
  const [color, setColor] = useState<CardColor>(defaultColor);
  const [selected, setSelected] = useState<boolean>(false);

  if (reset == true) {
    setColor(CardColor.Default);
    setSelected(false);
    setReset(false);
  }

  const handleCardClick = () => {
    if (guess) {
      if (selectCard(word)) setColor(CardColor.Green);
      else {
        setColor(CardColor.Red);
      }
    } else {
      if (color == CardColor.Default) {
        setColor(CardColor.Green);
        selectCard(word);
      } else {
        setColor(CardColor.Default);
        deselectCard(word);
      }
    }
    setSelected(true);
  };

  const innerCard = (
    <hstack
      width="90%"
      height="90%"
      cornerRadius="small"
      backgroundColor="white"
      alignment="center middle"
    >
      <text wrap={true} width="95%" alignment="center middle" color="black">
        {word}
      </text>
    </hstack>
  );

  return (
    <>
      <vstack height="60px" width="3px" />
      <vstack>
        <hstack width="100%" height="3px" />
        {/* {guess == true ? ( */}
        {completed || (selected && guess) ? (
          <hstack
            border="thick"
            alignment="middle center"
            cornerRadius="small"
            width="80px"
            height="60px"
            backgroundColor={color}
            borderColor="black"
          >
            {innerCard}
          </hstack>
        ) : (
          <hstack
            border="thick"
            alignment="middle center"
            cornerRadius="small"
            width="80px"
            height="60px"
            backgroundColor={color}
            borderColor="black"
            onPress={handleCardClick}
          >
            {innerCard}
          </hstack>
        )}

        <hstack width="100%" height="3px" />
      </vstack>
      <vstack height="60px" width="3px" />
    </>
  );
};

export const Board = (props: any) => {
  const handRows = [];

  for (let handRow = 0; handRow < 5; ++handRow) {
    const remain = 5;
    const cells = [];
    const keys = props.words;
    for (let r = 0; r < remain; ++r) {
      let word = keys[handRow * 5 + r];
      cells.push(
        <Card
          word={word}
          guess={props.guess}
          defaultColor={
            props.completed
              ? props.ans.has(word)
                ? CardColor.Green
                : CardColor.Red
              : CardColor.Default
          }
          selectCard={props.selectCard}
          deselectCard={props.deselectCard}
          completed={props.completed || props.failed}
          reset={props.reset}
          setReset={props.setReset}
        />
      );
    }
    handRows.push(<hstack>{cells}</hstack>);
  }

  return (
    <vstack>
      <hstack width="100%" height="3px" />
      <zstack alignment={"middle center"}>
        <vstack alignment={"middle center"} padding="small">
          <spacer size="medium" />
          <hstack>
            <vstack cornerRadius="small" alignment={"middle center"}>
              {handRows}
            </vstack>
          </hstack>
        </vstack>
      </zstack>
    </vstack>
  );
};
