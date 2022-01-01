<?php

array_map(
  function ($arg1, $arg2) use ($var1, $var2) {
    return $arg1 + $arg2 / ($var + $var2);
  },
  [
    "complex" => "code",
    "with" => "inconsistent",
    "formatting" => "is",
    "hard" => "to",
    "maintain" => true,
  ]
);
