document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => {
    // Send a POST request to the /emails route
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    })
    // Catch any errors and log them to the console
    .catch(error => {
      console.log('Error:', error);
    });
  }
  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Send a GET request to the /emails/inbox router
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {

    // Create an HTML element
    emails.forEach((email) => {
      const element_group = document.createElement('div');
      element_group.id = 'email-group';

      const element = document.createElement('div');
      const sender = document.createElement('div');
      const subject = document.createElement('div');
      const timestamp = document.createElement('div');
      element.id = 'email-container';
      timestamp.id = 'email-timestamp';

      sender.innerHTML = `<strong>${email.sender}</strong>`;
      subject.innerHTML = `${email.subject}`;
      timestamp.innerHTML = `${email.timestamp}`;

      element.appendChild(sender);
      element.appendChild(subject);
      element.appendChild(timestamp);

      // Check if email is read/unread
      if (email.read == true) {
        element.style.backgroundColor = 'gray';
        timestamp.style.color = 'white';
      }
      
      // When element has been clicked load email
      element.addEventListener('click', () => load_email(email));

      element_group.append(element);

      // Check if email is archive/unarchive
      const archived_btt = document.createElement('button');
      archived_btt.id = 'email-archived';
      if (mailbox != 'sent') {
        if (email.archived == true)
          archived_btt.innerHTML = `Unarchive`;
        else 
          archived_btt.innerHTML = `Archive`;

        // When archived has been clicked change email archive status
        archived_btt.addEventListener('click', () => {
          console.log('Email ID ' + email.id + ' has been archived as ' + email.archived)

          if (email.archived == true)
            var status = false;
          else 
            var status = true;

          // Send a PUT request to /emails/<email_id> to modify the archived
          fetch('/emails/' + email.id, {
            method: 'PUT',
            body: JSON.stringify({
                archived: status
            })
          })

          // Refresh page
          window.location.reload();
        });
        element_group.append(archived_btt);
      }

      document.querySelector('#emails-view').append(element_group);
    });
  })
  // Catch any errors and log them to the console
  .catch(error => {
    console.log('Error:', error);
  });
}

function load_email(email) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  
  console.log('Email ID ' + email.id + ' has been clicked!')
  // Send a PUT request to /emails/<email_id> to modify the read
  fetch('/emails/' + email.id, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  // Send a GET request to /emails/<email_id> to request the email
  fetch('/emails/' + email.id)
  .then(response => response.json())
  .then(email => {
      // Clear page
      var element = document.getElementById('email-header')
      if (document.getElementById('email-view').contains(element))
        element.remove();

      // Display email content
      console.log(email)
      element = document.createElement('div');
      const sender = document.createElement('div');
      const recipients = document.createElement('div');
      const subject = document.createElement('div');
      const timestamp = document.createElement('div');
      const reply = document.createElement('button');
      const body = document.createElement('div');

      element.id = 'email-header';

      sender.innerHTML = `<strong>From:</strong> ${email.sender}`;
      recipients.innerHTML = `<strong>To:</strong> ${email.recipients}`;
      subject.innerHTML = `<strong>Subject:</strong> ${email.subject}`;
      timestamp.innerHTML = `<strong>Timestamp:</strong> ${email.timestamp}`;
      reply.innerHTML = `Reply`;
      body.innerHTML = `<hr> ${email.body}`;

      reply.addEventListener('click', () => reply_email(email));

      element.appendChild(sender);
      element.appendChild(recipients);
      element.appendChild(subject);
      element.appendChild(timestamp);
      element.appendChild(reply);
      element.appendChild(body);

      document.querySelector('#email-view').append(element);
  })
  // Catch any errors and log them to the console
  .catch(error => {
    console.log('Error:', error);
  });
}

function reply_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Pre-fill composition fields
  document.querySelector('#compose-recipients').value = email.sender;

  // Check if the subject starts with 'Re:' to avoid adding it multiple times
  if (!email.subject.startsWith('Re:')) {
    console.log("Adding Re: to subject");
    document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
  } else {
    document.querySelector('#compose-subject').value = email.subject;
  }
  
  document.querySelector('#compose-body').value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote: ' + email.body;

  document.querySelector('#compose-form').onsubmit = () => {
    // Send a POST request to the /emails route
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    })
    // Catch any errors and log them to the console
    .catch(error => {
      console.log('Error:', error);
    });
  }
}