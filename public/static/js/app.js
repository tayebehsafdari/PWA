console.log(window);
console.log(window.navigator.serviceWorker);

if ('serviceWorker' in navigator) {
    navigator
        .serviceWorker
        // .register('/serviceWorker.js')
        .register('/sw.js')
        .then(registration => {
            console.log('serviceWorker successfully registered =>', registration);
        })
        .catch(err => {
            console.log('serviceWorker failed.', err);
        });
} else {
    console.log('This browser does not support serviceWorker.');
}

let installPromptEvent;

// console.log("installPromptEvent 1", installPromptEvent);

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    // console.log("beforeinstallprompt", event);
    installPromptEvent = event;
    // console.log("installPromptEvent 2", installPromptEvent);
});

// console.log("installPromptEvent 3", installPromptEvent);


document.querySelector('.plus a').addEventListener('click', (event) => {
    event.preventDefault();
    console.log("installPromptEvent 4", installPromptEvent);
    if (installPromptEvent) {
        installPromptEvent.prompt();
    }

    installPromptEvent
        .userChoice
        .then(choiceResult => {
            console.log("choiceResult", choiceResult);
            if (choiceResult.outcome === "accepted") {
                console.log("accepted");
            } else {
                console.log("dismissed");
            }
        })
        .catch();
    installPromptEvent = null;
});


fetch("https://jsonplaceholder.typicode.com/posts")
    .then(response => {
        // console.log("response: ", response.json());
        return response.json();
    })
    .then(posts => {
        // console.log("response posts: ", posts);
        posts.forEach(post => {
            createPost(post);
        });
    })
    .catch(err => {
        // console.log("response err: ", err);
        if ('indexedDB' in window) {
            db.posts.toArray()
                .then(posts => {
                    console.log("indexedDB", posts);
                    posts.forEach(post => {
                        createPost(post);
                    });
                });
        }
    });


function createPost(post) {
    let card = `
            <div class="post-item">
                    <h2>${post.title}</h2>
                    <h5>شرح عنوان ، 7 دسامبر 2017</h5>
                    <div class="fakeimg">
                        <img src="./static/images/logo512.png" alt="تصویر جعلی">
                    </div>
                    <p>برخی از متن ..</p>
                    <p>${post.body}</p>
                </div>
                <br>
            `;

    let element = document.querySelector('#posts');
    if (element != undefined) {
        element.innerHTML += card;
    }
}