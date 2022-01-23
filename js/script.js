'use strict';

const main = document.querySelector('.main');
const selection = document.querySelector('.selection');
const title = document.querySelector('.main__title');

const createElem = (elem, className, text) => {
    const newElem = document.createElement(elem);

    className.forEach(name => {
        newElem.classList.add(name);
    });
    if (text) {
        newElem.textContent = text;
    }
    return newElem;
}

const loadResult = (id) => localStorage.getItem(id);

const renderTheme = themes => {
    const listElem = document.querySelector('.selection__list');

    listElem.textContent = '';
    const buttons = themes.map(theme => {
        const result = loadResult(theme.id);

        const li = createElem('li', ['selection__item']);
        const button = createElem('button', ['selection__theme'], theme.theme);

        li.append(button);

        button.dataset.id = theme.id;
        if(result) {
            const p = createElem('p', ['selection__result']);
            p.innerHTML = ` <span class="selection__result-ratio">${result}/${theme.list.length}</span>
                        <span class="selection__result-text">Последний результат</span>`;
            li.append(p);
        }

        listElem.append(li);
        return button;
    });

    return buttons;
};

const getData = () => {
    return fetch('db/quiz_db.json').then(response => response.json());
};

const showElem = (elem) => {
    let opacity = 0;
    elem.opacity = opacity;
    elem.style.display = '';

    const animation = () => {
        opacity += 0.07;
        elem.style.opacity = opacity;

        if(opacity < 1) {
            requestAnimationFrame(animation);
        }
    };

    requestAnimationFrame(animation);
}

const hideElem = (elem, cb) => {
    let opacity = getComputedStyle(elem).getPropertyValue('opacity');

    const animation = () => {
        opacity -= 0.07;
        elem.style.opacity = opacity;

        if(opacity > 0) {
            requestAnimationFrame(animation);
        } else {
            elem.style.display = 'none';
            if(cb) cb();
        }
    };
    requestAnimationFrame(animation);
};

const shuffle = arr => {
    const newArr = [...arr];

    newArr.forEach((item, i) => {
        let j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    });

    return newArr;
}

const createKeyAnswers = data => {
    const keys = data.answers.map((answer, i) => {
        if(data.type === 'radio') {
            return [answer, !i];
        } else {
            return [answer, i < data.correct];
        }
    });

    return shuffle(keys);
}

const createAnswer = data => {
    const type = data.type;
    const answers = createKeyAnswers(data);

    const labels = answers.map((item, i) => {
        const label = createElem('label', ['answer']);
        const input = createElem('input', [`answer__${type}`]);

        input.type = type;
        input.name = 'answer';
        input.value = i;

        const text = document.createTextNode(item[0]);

        label.append(input, text);
        return label;
    });

    const keys = answers.map(answer => answer[1]);

    return {
        labels,
        keys
    }
};

const showResult = (result, quiz) => {
    const percent = result / quiz.list.length * 100;
    let ratio = 0;

    quiz.result.forEach((res, i) => {
        if (percent >= res[0]) {
            ratio = i;
        }
    });

    const block = createElem('div', ['main__box', 'main__box_result']);
    const button = createElem('button', ['main__btn', 'result__return'], `К списку квизов`);

    block.innerHTML = `<h2 class="main__subtitle main__subtitle_result">Ваш результат</h2>
        <div class="result__box">
            <p class="result__ratio result__ratio_${ratio + 1}">${result}/${quiz.list.length}</p>
            <p class="result__text">${quiz.result[ratio][1]}</p>
        </div>`;

    button.addEventListener('click', () => {
        hideElem(block, () => {
            showElem(title);
            showElem(selection);
        });
        initQuiz();
    });

    block.append(button);
    main.append(block)
};

const saveResult = (result, idTest) => {
    localStorage.setItem(idTest, result);
}

const renderQuiz = quiz => {
    hideElem(title);
    hideElem(selection);

    const questionBox = createElem('div', ['main__box', 'main__box_question']);

    main.append(questionBox);

    let questionCount = 0;
    let result = 0;

    const showQuestion = () => {
        const data = quiz.list[questionCount];
        questionCount++;

        questionBox.textContent = '';

        const form = createElem('form', ['main__form-question']);
        const fieldset = document.createElement('fieldset');
        const legend = createElem('legend', ['main__subtitle']);

        form.dataset.count = `${questionCount} / ${quiz.list.length}`;
        legend.textContent = `${data.question}`;

        const answersData = createAnswer(data);

        const button = createElem('button', ['main__btn', 'question__next'],'Подтвердить');
        button.type = 'submit';

        fieldset.append(legend, ...answersData.labels);
        form.append(fieldset, button);
        questionBox.append(form);

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            let ok = false;

            const answers = [...form.answer].map(input => {
                if(input.checked) ok = true;
                return input.checked ? input.value : false;
            });

            if (ok) {
                if(answers.every((res, i) => !!res === answersData.keys[i])) {
                    result++;
                }
                if (questionCount < quiz.list.length) {
                    showQuestion();
                } else {
                    hideElem(questionBox);
                    showResult(result, quiz);
                    saveResult(result, quiz.id);
                }

            } else {
                form.classList.add('main__form-question_error');
                setTimeout(() => {
                    form.classList.remove('main__form-question_error');
                }, 1000);
            }

        });
    }

    showQuestion();
};

const addClick = (buttons, data) => {
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const quiz = data.find(item => item.id === btn.dataset.id);
            renderQuiz(quiz);
        });
    });
};

const initQuiz = async () => {
    const data = await getData();
    const buttons = renderTheme(data);
    addClick(buttons, data);
}

initQuiz();