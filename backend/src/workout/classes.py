from dataclasses import dataclass
from enum import Enum


class SetType(Enum):
    WARMUP = 1  # low RPE, increase weight each set
    WORKSET = 2  # normal working sets
    DROPSET = 3  # no rest between sets, lower weight each set
    SUPERSET = 4  # no rest between exercises, perform different exercises back to back
    FAILURE = 5  # perform until failure (auto RPE 10)


@dataclass(kw_only=True)
class Set:
    type_: SetType = SetType.WORKSET
    rpe: float | None = None  # between 1 and 10
    weight: float | None = None  # kg
    rest: int = 0 # seconds


@dataclass
class Exercise:
    name: str
    sets: list[Set]


@dataclass(kw_only=True)
class RepSet(Set):
    reps: int | None = None
    tempo: tuple[int, int, int] = (0, 0, 0)  # excentric/concentric, isometric, concentric/excentric (seconds)


@dataclass(kw_only=True)
class DurationSet(Set):
    duration: int  # seconds


@dataclass
class Workout:
    name: str
    exercises: list[Exercise]


@dataclass
class Mesocycle:
    name: str
    workouts: list[Workout]


@dataclass
class MacroCycle:
    name: str
    mesocycles: list[Mesocycle]
