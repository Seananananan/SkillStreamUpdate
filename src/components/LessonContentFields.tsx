import { Plus, X } from "lucide-react";
import {
  contentFieldHint,
  contentFieldLabel,
  contentTypeLabels,
  lessonContentTypes,
  type LessonDraft,
} from "@/lib/lessonContent";

export function LessonContentFields({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: LessonDraft;
  onChange: (patch: Partial<LessonDraft>) => void;
}) {
  const contentId = `${idPrefix}-content`;

  function patchQuestion(
    questionIndex: number,
    patch: Partial<LessonDraft["quizQuestions"][number]>,
  ) {
    const questions = values.quizQuestions.map((question, index) =>
      index === questionIndex ? { ...question, ...patch } : question,
    );
    onChange({ quizQuestions: questions });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor={`${idPrefix}-title`}>
          Lesson title
        </label>
        <input
          id={`${idPrefix}-title`}
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="field mt-1.5"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div>
          <label className="label" htmlFor={`${idPrefix}-type`}>
            Type
          </label>
          <select
            id={`${idPrefix}-type`}
            value={values.contentType}
            onChange={(event) =>
              onChange({
                contentType: event.target.value as LessonDraft["contentType"],
              })
            }
            className="field mt-1.5"
          >
            {lessonContentTypes.map((type) => (
              <option key={type} value={type}>
                {contentTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${idPrefix}-duration`}>
            {values.contentType === "quiz" ? "Timer (minutes)" : "Minutes"}
          </label>
          <input
            id={`${idPrefix}-duration`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={values.durationMinutes}
            onChange={(event) => onChange({ durationMinutes: event.target.value })}
            className="field mt-1.5 tabular-nums"
            placeholder="—"
          />
        </div>
      </div>

      {values.contentType === "quiz" ? (
        <fieldset className="space-y-3">
          <legend className="label">Questions</legend>
          <p className="hint">{contentFieldHint("quiz")}</p>
          {values.quizQuestions.map((question, questionIndex) => (
            <div
              key={`${idPrefix}-question-${questionIndex}`}
              className="rounded-lg border border-line p-4"
            >
              <label
                className="label"
                htmlFor={`${idPrefix}-prompt-${questionIndex}`}
              >
                Question {questionIndex + 1}
              </label>
              <textarea
                id={`${idPrefix}-prompt-${questionIndex}`}
                value={question.prompt}
                onChange={(event) =>
                  patchQuestion(questionIndex, { prompt: event.target.value })
                }
                rows={2}
                className="field mt-1.5 resize-y"
                placeholder="What is the main job of HTML?"
              />
              <p className="label mt-3">Choices</p>
              <p className="hint mt-0.5">Mark the correct choice.</p>
              <ul className="mt-2 space-y-2">
                {question.choices.map((choice, choiceIndex) => (
                  <li
                    key={`${idPrefix}-question-${questionIndex}-choice-${choiceIndex}`}
                    className="flex gap-2"
                  >
                    <input
                      type="radio"
                      name={`${idPrefix}-correct-${questionIndex}`}
                      className="mt-3"
                      checked={question.correctIndex === choiceIndex}
                      onChange={() =>
                        patchQuestion(questionIndex, {
                          correctIndex: choiceIndex,
                        })
                      }
                      aria-label={`Mark question ${questionIndex + 1}, choice ${choiceIndex + 1} as correct`}
                    />
                    <label
                      className="sr-only"
                      htmlFor={`${idPrefix}-question-${questionIndex}-choice-${choiceIndex}`}
                    >
                      Choice {choiceIndex + 1}
                    </label>
                    <input
                      id={`${idPrefix}-question-${questionIndex}-choice-${choiceIndex}`}
                      value={choice}
                      onChange={(event) => {
                        const choices = [...question.choices];
                        choices[choiceIndex] = event.target.value;
                        patchQuestion(questionIndex, { choices });
                      }}
                      className="field flex-1"
                      placeholder={`Choice ${choiceIndex + 1}`}
                    />
                    {question.choices.length > 2 ? (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => {
                          const choices = question.choices.filter(
                            (_, index) => index !== choiceIndex,
                          );
                          const correctIndex =
                            question.correctIndex === choiceIndex
                              ? 0
                              : question.correctIndex > choiceIndex
                                ? question.correctIndex - 1
                                : question.correctIndex;
                          patchQuestion(questionIndex, {
                            choices,
                            correctIndex,
                          });
                        }}
                        aria-label={`Remove question ${questionIndex + 1}, choice ${choiceIndex + 1}`}
                      >
                        <X aria-hidden="true" size={16} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {question.choices.length < 4 ? (
                <button
                  type="button"
                  className="btn btn-quiet mt-2"
                  onClick={() =>
                    patchQuestion(questionIndex, {
                      choices: [...question.choices, ""],
                    })
                  }
                >
                  <Plus aria-hidden="true" size={16} />
                  Add choice
                </button>
              ) : null}
            </div>
          ))}
        </fieldset>
      ) : (
        <div>
          <label className="label" htmlFor={contentId}>
            {contentFieldLabel(values.contentType)}
          </label>
          <p className="hint mt-0.5">{contentFieldHint(values.contentType)}</p>
          {values.contentType === "video" ? (
            <input
              id={contentId}
              type="url"
              value={values.contentRef}
              onChange={(event) => onChange({ contentRef: event.target.value })}
              className="field mt-1.5"
              placeholder="https://"
            />
          ) : (
            <textarea
              id={contentId}
              value={values.contentRef}
              onChange={(event) => onChange({ contentRef: event.target.value })}
              rows={5}
              className="field mt-1.5 resize-y"
              placeholder={
                values.contentType === "assignment"
                  ? "Rewrite this outline as a short page with one heading and two paragraphs."
                  : "The web is a request-and-response system."
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
