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
  const quizPromptId = `${idPrefix}-prompt`;

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
            Minutes
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
          <legend className="label">{contentFieldLabel("quiz")}</legend>
          <p className="hint">{contentFieldHint("quiz")}</p>
          <label className="sr-only" htmlFor={quizPromptId}>
            Question
          </label>
          <textarea
            id={quizPromptId}
            value={values.quizPrompt}
            onChange={(event) => onChange({ quizPrompt: event.target.value })}
            rows={3}
            className="field resize-y"
            placeholder="What is the main job of HTML?"
          />
          <div>
            <p className="label">Choices</p>
            <p className="hint mt-0.5">Mark the correct choice. A wrong answer does not complete the lesson.</p>
            <ul className="mt-2 space-y-2">
              {values.quizChoices.map((choice, index) => (
                <li key={`${idPrefix}-choice-${index}`} className="flex gap-2">
                  <input
                    type="radio"
                    name={`${idPrefix}-correct`}
                    className="mt-3"
                    checked={values.quizCorrectIndex === index}
                    onChange={() => onChange({ quizCorrectIndex: index })}
                    aria-label={`Mark choice ${index + 1} as correct`}
                  />
                  <label className="sr-only" htmlFor={`${idPrefix}-choice-${index}`}>
                    Choice {index + 1}
                  </label>
                  <input
                    id={`${idPrefix}-choice-${index}`}
                    value={choice}
                    onChange={(event) => {
                      const next = [...values.quizChoices];
                      next[index] = event.target.value;
                      onChange({ quizChoices: next });
                    }}
                    className="field flex-1"
                    placeholder={`Choice ${index + 1}`}
                  />
                  {values.quizChoices.length > 2 ? (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => {
                        const next = values.quizChoices.filter(
                          (_, choiceIndex) => choiceIndex !== index,
                        );
                        const correctIndex =
                          values.quizCorrectIndex === index
                            ? 0
                            : values.quizCorrectIndex > index
                              ? values.quizCorrectIndex - 1
                              : values.quizCorrectIndex;
                        onChange({ quizChoices: next, quizCorrectIndex: correctIndex });
                      }}
                      aria-label={`Remove choice ${index + 1}`}
                    >
                      <X aria-hidden="true" size={16} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {values.quizChoices.length < 4 ? (
              <button
                type="button"
                className="btn btn-quiet mt-2"
                onClick={() =>
                  onChange({ quizChoices: [...values.quizChoices, ""] })
                }
              >
                <Plus aria-hidden="true" size={16} />
                Add choice
              </button>
            ) : null}
          </div>
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
