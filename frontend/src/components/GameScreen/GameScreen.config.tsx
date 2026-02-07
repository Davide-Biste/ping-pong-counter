export interface GameMode {
    _id: string;
    name: string;
    pointsToWin: number;
    servesBeforeChange: number;
    rulesDescription: string;
    isDeuceEnabled: boolean;
}

export interface Player {
    _id: string;
    name: string;
    funNickname: string;
    wins: number;
}

export interface GameScreenProps {
    playerA: Player;
    playerB: Player;
    gameMode: GameMode;
    onEndMatch: () => void;
}
