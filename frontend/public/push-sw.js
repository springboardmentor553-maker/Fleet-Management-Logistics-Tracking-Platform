self.addEventListener(
  "push",
  (event) => {

    let data = {
      title: "FleetFlow",
      message: "You have a new notification.",
    };

    try {

      if (event.data) {
        data = event.data.json();
      }

    } catch (error) {

      console.error(
        "Unable to parse push notification:",
        error
      );

    }


    event.waitUntil(

      self.registration.showNotification(
        data.title || "FleetFlow",
        {
          body:
            data.message ||
            "You have a new notification.",

          icon:
            "/favicon.svg",

          badge:
            "/favicon.svg",

          tag:
            "fleetflow-notification",

          data: {
            url:
              "/",
          },
        }
      )

    );

  }
);


self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();


    event.waitUntil(

      clients.matchAll(
        {
          type: "window",
          includeUncontrolled: true,
        }
      )

      .then(
        (clientList) => {

          for (
            const client
            of clientList
          ) {

            if (
              "focus"
              in client
            ) {

              return client.focus();

            }

          }


          if (
            clients.openWindow
          ) {

            return clients.openWindow(
              event.notification.data?.url
              || "/"
            );

          }

        }
      )

    );

  }
);